import { Injectable } from '@angular/core';
import * as config from "../../assets/config.json"
import { HttpClient, HttpHeaders } from "@angular/common/http";

@Injectable({
  providedIn: 'root'
})
export class ReqService {
  private static readonly API_URL = "https://api.hcdp.ikewai.org";
  private static readonly API_HEADER = new HttpHeaders({
    "Authorization": `Bearer ${config.apiToken}`
  })

  constructor(private http: HttpClient) {

  }

  private async getFromAPI(ep: string, urlParams: any = {}): Promise<any> {
    let paramString = this.encodeURLParams(urlParams);
    let url = `${ReqService.API_URL}${ep}`;
    if(paramString) {
      url += `?${paramString}`;
    }
    let obs = this.http.get(url, {headers: ReqService.API_HEADER});
    return new Promise((resolve, reject) => {
      obs.subscribe({
        next: (res: any) => {
          resolve(res);
        },
        error: (e) => {
          reject(e);
        }
      });
    });
  }

  async getStations(): Promise<StationData[]> {
    const ep = "/mesonet/getStations";
    return this.getFromAPI(ep);
  }

  async getVariables(stationID: string): Promise<VariableData[]> {
    const ep = "/mesonet/getVariables";
    return this.getFromAPI(ep, {
      station_id: stationID
    });
  }

  async getMeasurements(stationID: string, options: MeasurementParams): Promise<MeasurementData> {
    const ep = "/mesonet/getMeasurements";
    return this.getFromAPI(ep, {
      station_id: stationID,
      ...options
    });
  }

  private encodeURLParams(params: any) {
    let parts = [];
    for(let param in params) {
      parts.push(`${param}=${encodeURIComponent(params[param])}`);
    }
    return parts.join("&");
  }
}

export interface MeasurementParams {
  limit?: number,
  offset?: number,
  start_date?: string,
  end_date?: string,
  var_ids?: string
}


export interface MeasurementData {
  [stationID: string]: {
    [variable: string]: {
      [timestamp: string]: number | null
    }
  }
}

export interface VariableData {
  [varID: string]: {
    var_id: string,
    var_name: string,
    unit: string,
    [key: string]: any
  }
}

export interface StationData {
  [stationID: string]: {
    site_id: string,
    site_name: string
    description: string,
    elevation: number,
    latitude: number,
    longitude: number,
    [key: string]: any
  }
}
