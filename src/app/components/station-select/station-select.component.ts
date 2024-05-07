import { Component } from '@angular/core';
import { MeasurementParams, ReqService, StationData, VariableData } from "../../services/req.service"
import { OwlDateTimeModule, OwlNativeDateTimeModule } from '@danielmoncada/angular-datetime-picker';
import moment from "moment";
import { FormControl } from '@angular/forms';
import { ReactiveFormsModule} from '@angular/forms';
import { DownloadHelperService, FileData } from '../../services/download-helper.service';
import { DataPackagerService, PackageModeFlags } from '../../services/data-packager.service';
import {MatInputModule} from '@angular/material/input';
import {MatIconModule} from '@angular/material/icon';
import {MatButtonModule} from '@angular/material/button';
import { CommonModule } from '@angular/common';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {MatExpansionModule} from '@angular/material/expansion';
import {MatTooltipModule} from '@angular/material/tooltip';
import {MatSelectModule} from '@angular/material/select';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';


import { MultiSelectorComponent } from '../multi-selector/multi-selector.component';

import { MatMomentDatetimeModule } from '@mat-datetimepicker/moment';
import { MatDatetimepickerModule } from '@mat-datetimepicker/core';

@Component({
  selector: 'app-station-select',
  standalone: true,
  imports: [MatProgressSpinnerModule, MatTooltipModule, OwlDateTimeModule, OwlNativeDateTimeModule, ReactiveFormsModule, MatInputModule, MatIconModule, MatButtonModule, CommonModule, MatCheckboxModule, MatExpansionModule, MultiSelectorComponent, MatMomentDatetimeModule, MatDatetimepickerModule, MatSelectModule],
  templateUrl: './station-select.component.html',
  styleUrl: './station-select.component.scss'
})
export class StationSelectComponent {
  public stations: StationData[] = [];
  public variables: VariableData[] = [];
  public loading: boolean = false;
  private selectedStations: StationData[] = [];
  private selectedVariables: VariableData[] = [];

  fileFormats = {
    description: "The file format to package the data in.",
    formats: [{
      label: "CSV",
      value: "csv"
    }, {
      label: "JSON",
      value: "json"
    }]
  };
    
  csvFormats = {
    description: "The format of the CSV file.",
    formats: [{
      label: "Table",
      description: "A table of values for each station, timestamp, and variable.",
      value: "table"
    }, {
      label: "Matrix",
      description: "A matrix of values for each station in timestamp x variable format.",
      value: "matrix"
    }]
  };

  startControl = new FormControl(moment().subtract(12, "hours"));
  endControl = new FormControl(moment());
  limitControl = new FormControl(null);
  offsetControl = new FormControl(null);
  fileFormatControl = new FormControl("csv");
  singleFileControl = new FormControl(false);
  csvFormatControl = new FormControl("table");

  constructor(private reqService: ReqService, private downloadService: DownloadHelperService, private packager: DataPackagerService) {
    this.getStations();
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
    this.selectedStations = stations;
  }

  variablesSelected(variables: VariableData[]) {
    this.selectedVariables = variables;
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

  validate(): boolean {
    return this.selectedStations.length > 0 && this.selectedVariables.length > 0 && !this.loading;
  }

  async download(): Promise<void> {
    this.loading = true;
    let start = this.startControl.value?.toISOString() || undefined;
    let end = this.endControl.value?.toISOString() || undefined;
    let limit = this.limitControl.value || undefined;
    let offset = this.offsetControl.value || undefined;
    let stationIDs = this.selectedStations.map((station: StationData) => {
      return station.site_id;
    });
    let varIDs = this.selectedVariables.length == this.variables.length ? [] : this.selectedVariables.map((variable: VariableData) => {
      return variable.var_id;
    });
    let measurements = await this.getValues(stationIDs, start, end, limit, offset, varIDs);
    console.log(measurements);
    let formatFlags = this.singleFileControl.value ? PackageModeFlags.SINGLE : PackageModeFlags.MULTI;
    formatFlags |= this.csvFormatControl.value == "matrix" ? PackageModeFlags.MATRIX : PackageModeFlags.TABLE;
    let data: FileData[] = [];
    if(this.fileFormatControl.value == "csv") {
      data = this.packager.json2csv(measurements, this.selectedVariables, this.selectedStations, formatFlags);
    }
    else {
      data = this.packager.json2data(measurements, formatFlags);
    }
    if(data.length > 0) {
      this.downloadService.download(data);
    }
    this.loading = false;
  }
}