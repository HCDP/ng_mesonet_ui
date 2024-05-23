import { Injectable } from '@angular/core';
import * as config from "../../assets/config.json"
import { HttpClient, HttpErrorResponse, HttpEvent, HttpEventType, HttpHeaders } from "@angular/common/http";
import { BehaviorSubject, Observable, retry, firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ReqService {
  private static readonly API_URL = "https://api.hcdp.ikewai.org";
  private static readonly API_HEADER = new HttpHeaders({
    "Authorization": `Bearer ${config.apiToken}`
  })
  private static readonly RETRIES = 0;


  constructor(private http: HttpClient) { }

  private async getFromAPI(ep: string, urlParams: any = {}, options: any = {headers: ReqService.API_HEADER}, retries = ReqService.RETRIES): Promise<any> {
    let paramString = this.encodeURLParams(urlParams);
    let url = `${ReqService.API_URL}${ep}`;
    if(paramString) {
      url += `?${paramString}`;
    }
    
    return firstValueFrom(this.http.get(url, options)
    .pipe(
      retry(retries)
    ));
  }

  private getFile(url: string, retries = ReqService.RETRIES): FileDownloadInfo {
    console.log(url);
    const responseType: "arraybuffer" = "arraybuffer";
    const observe: "events" = "events";
    let options = {
      headers: ReqService.API_HEADER,
      responseType: responseType,
      reportProgress: true,
      observe: observe
    };

    let progress = new BehaviorSubject<number>(0);
    let fileData = new Promise<{fname: string, data: ArrayBuffer}>((resolve, reject) => {
      this.http.get(url, options)
      .pipe(
        retry(retries)
      ).subscribe({
        next: (event: HttpEvent<ArrayBuffer>) => {
          if(event.type === HttpEventType.DownloadProgress && event.total !== undefined) {
            let percentComplete = (event.loaded / event.total) * 100;
            progress.next(percentComplete);
          }
          else if(event.type === HttpEventType.Response) {
            resolve({
              fname: "data.zip",
              data: event.body!
            });
            progress.complete();
          }
        },
        error: (e: HttpErrorResponse) => {
          progress.error(e);
          reject(e)
        }
      });
    });
    return {
      progress: progress.asObservable(),
      fileData
    }
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
    }).then((data: MeasurementData) => {
      delete data["measurements_in_file"];
      return data;
    });
  }

  async getDataPackage(options: PackageParams): Promise<FileDownloadInfo> {
    const ep = "/mesonet/createPackage/link";
    const link = await this.getFromAPI(ep, options, {
      headers: ReqService.API_HEADER,
      responseType: "text"
    });
    return this.getFile(link);
  }

  async emailDataPackage(options: PackageParams): Promise<string> {
    const ep = "/mesonet/createPackage/email";
    return this.getFromAPI(ep, options, {
      headers: ReqService.API_HEADER,
      responseType: "text"
    });
  }

  private encodeURLParams(params: any) {
    let parts = [];
    for(let param in params) {
      if(params[param] !== undefined) {
        parts.push(`${param}=${encodeURIComponent(params[param])}`);
      }
    }
    return parts.join("&");
  }
}

export interface MeasurementParams {
  start_date?: string,
  end_date?: string,
  limit?: number,
  offset?: number,
  var_ids?: string
}

export interface PackageParams {
  station_ids: string,
  email: string,
  combine?: boolean,
  ftype?: "csv" | "json",
  csvMode?: "matrix" | "table",
  start_date?: string,
  end_date?: string,
  limit?: number,
  offset?: number,
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
    var_id: string,
    var_name: string,
    unit: string,
    [key: string]: any
}

export interface StationData {
  site_id: string,
  site_name: string
  description: string,
  elevation: number,
  latitude: number,
  longitude: number,
  instruments: {
    variables: VariableData[],
    [key: string]: any
  }[]
  [key: string]: any
}

export interface FileData {
  fname: string,
  data: ArrayBuffer
}

export interface FileDownloadInfo {
  progress: Observable<number>,
  fileData: Promise<FileData>
}