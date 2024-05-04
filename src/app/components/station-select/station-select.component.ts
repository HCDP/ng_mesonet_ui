import { Component } from '@angular/core';
import { MeasurementParams, ReqService, StationData, VariableData } from "../../services/req.service"
import { OwlDateTimeModule, OwlNativeDateTimeModule } from '@danielmoncada/angular-datetime-picker';
import moment, { Moment } from "moment";
import { FormControl } from '@angular/forms';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import { DownloadHelperService, FileData } from '../../services/download-helper.service';
import { DataPackagerService, PackageModeFlags } from '../../services/data-packager.service';
import {MatInputModule} from '@angular/material/input';
import {MatIconModule} from '@angular/material/icon';
import {MatButtonModule} from '@angular/material/button';
import { CommonModule } from '@angular/common';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {MatExpansionModule} from '@angular/material/expansion';

import { MultiSelectorComponent } from '../multi-selector/multi-selector.component';

@Component({
  selector: 'app-station-select',
  standalone: true,
  imports: [OwlDateTimeModule, OwlNativeDateTimeModule, ReactiveFormsModule, MatInputModule, MatIconModule, MatButtonModule, CommonModule, MatCheckboxModule, MatExpansionModule, MultiSelectorComponent],
  templateUrl: './station-select.component.html',
  styleUrl: './station-select.component.scss'
})
export class StationSelectComponent {
  public stations: StationData[] = [];
  public variables: VariableData[] = [];


  public dateControl = new FormControl([null, null]);

  constructor(private reqService: ReqService, private downloadService: DownloadHelperService, private packager: DataPackagerService) {
    this.getStations();
    this.dateControl.valueChanges.subscribe((value) => {
      console.log(value);
    });
  }

  matchStation(value: string, station: StationData) {
    let match = false;
    if(station.site_name.toLowerCase().includes(value.toLowerCase()) || station.site_id.toLowerCase().includes(value.toLowerCase())) {
      match = true;
    }
    return match;
  }

  matchVariable(value: string, variable: VariableData) {
    let match = false;
    if(variable.var_name.toLowerCase().includes(value.toLowerCase()) || variable.var_id.toLowerCase().includes(value.toLowerCase())) {
      match = true;
    }
    return match;
  }

  getStationLabel(station: StationData) {
    return `${station.site_name} (${station.site_id})`
  }

  getVariableLabel(variable: VariableData) {
    let label = variable.var_name
    if(variable.unit) {
      label += ` (${variable.unit})`;
    }
    return label;
  }

  stationsSelected(stations: StationData[]) {
    console.log(stations);
  }

  variablesSelected(variables: VariableData[]) {
    console.log(variables);
  }

  private async getStations() {
    this.stations = await this.reqService.getStations();
    let stationIDs = this.stations.map((station: StationData) => {
      return station.site_id;
    });
    this.variables = await this.getVariables(stationIDs);
  }

  private async getVariables(stationIDs: string[]) {
    let reqPromises = [];
    for(let station of stationIDs) {
      console.log(station);
      let p = this.reqService.getVariables(station);
      reqPromises.push(p);
    }
    return Promise.all(reqPromises).then((vars) => {
      let flattened = vars.flat();
      let varIDs = new Set<string>();
      flattened = flattened.filter((variable: any) => {
        if(!varIDs.has(variable.var_id)) {
          varIDs.add(variable.var_id);
          return true;
        }
        return false;
      });
      return flattened;
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

    let data: any = {}
    let reqData: [string, Promise<any>][] = [];
    for(let id of stationIDs) {
      reqData.push([id, this.reqService.getMeasurements(id, opts)]);
    }
    for(let item of reqData) {
      try {
        let stationData = await item[1];
        data[item[0]] = stationData;
      }
      catch {}
    }
    return data;
  }
}