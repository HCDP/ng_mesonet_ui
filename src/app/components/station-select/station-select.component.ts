import { Component } from '@angular/core';
import { MeasurementParams, ReqService } from "../../services/req.service"
import { OwlDateTimeModule, OwlNativeDateTimeModule } from '@danielmoncada/angular-datetime-picker';
import moment, { Moment } from "moment";
import { FormControl } from '@angular/forms';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';

@Component({
  selector: 'app-station-select',
  standalone: true,
  imports: [OwlDateTimeModule, OwlNativeDateTimeModule, ReactiveFormsModule],
  templateUrl: './station-select.component.html',
  styleUrl: './station-select.component.scss'
})
export class StationSelectComponent {
  selectedStations = [];

  public dateControl = new FormControl([null, null]);

  constructor(private reqService: ReqService) {
    this.getStations();
    this.dateControl.valueChanges.subscribe((value) => {
      console.log(value);
    });
  }

  private async getStations() {
    let stations: any[] = await this.reqService.getStations();
    let ids = stations.slice(0, 10).map((station: any) => {
      return station.site_id;
    });
    this.getVariables(ids);
  }

  private async getVariables(stationIDs: string[]) {
    let reqPromises = [];
    for(let station of stationIDs) {
      console.log(station);
      let p = this.reqService.getVariables(station);
      reqPromises.push(p);
    }
    return Promise.all(reqPromises).then((vars) => {
      vars = vars.flat();
      let varIDs = new Set<string>();
      vars = vars.filter((variable: any) => {
        if(!varIDs.has(variable.var_id)) {
          varIDs.add(variable.var_id);
          return true;
        }
        return false;
      });
      return vars;
    });
  }

  private async getValues(stationIDs: string[], startDate?: string, endDate?: string, limit?: number, offset?: number, varIDs: string[] = []): Promise<any> {
    let opts: MeasurementParams = {};
    if(startDate !== undefined) {
      opts.start_date = startDate;
    }
    if(endDate !== undefined) {
      opts.end_date = endDate;
    }
    if(offset !== undefined) {
      opts.offset = offset;
    }
    if(limit !== undefined) {
      opts.limit = limit;
    }
    if(varIDs.length > 0) {
      opts.var_ids = varIDs.join(",");
    }

    let reqPromises = [];
    for(let id of stationIDs) {
      reqPromises.push(this.reqService.getMeasurements(id, opts));
      
    }
    return Promise.all(reqPromises).then((vars) => {
      vars = vars.flat();
      let varIDs = new Set<string>();
      vars = vars.filter((variable: any) => {
        if(!varIDs.has(variable.var_id)) {
          varIDs.add(variable.var_id);
          return true;
        }
        return false;
      });
      return vars;
    });
  }
}
