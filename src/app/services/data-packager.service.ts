import { Injectable } from '@angular/core';
import { MeasurementData, StationData, VariableData } from './req.service';
import { FileData } from './download-helper.service';

@Injectable({
  providedIn: 'root'
})
export class DataPackagerService {

  constructor() { }

  private constructTable(measurements: MeasurementData, varData: VariableMap, stationData: StationMap): string[][] {
    let header = ["station_name", "station_id", "timestamp", "variable_name", "variable_id", "unit", "value"];
    let data = [header];
    for(let station in measurements) {
      for(let variable in measurements[station]) {
        for(let timestamp in measurements[station][variable]) {
          let row = [stationData[station].site_name, station, timestamp, varData[variable].var_name, variable, varData[variable].unit, (measurements[station][variable][timestamp] || "NA").toString()];
          data.push(row);
        }
      }
    }
    return data;
  }

  private constructMatrix(measurements: MeasurementData, varData: VariableMap, stationData: StationMap): string[][] {
    let variables = new Set<string>();
    for(let station in measurements) {
      for(let variable in measurements[station]) {
        variables.add(variable);
      }
    }
    let varIDs = Array.from(variables);
    let varNames = varIDs.map((id: string) => {
      return varData[id].var_name;
    });
    let units = varIDs.map((id: string) => {
      return varData[id].unit;
    });
    let data = [
      ["", "", ""].concat(varIDs),
      ["", "", ""].concat(units),
      ["station_name", "station_id", "timestamp"].concat(varNames)
    ];
    for(let station in measurements) {
      let stationName = stationData[station].site_name;
      let rows: {[timestamp: string]: string[]} = {};
      for(let i = 0; i < varIDs.length; i++) {
        let variable = varIDs[i];
        let values = measurements[station][variable] || {};
        for(let timestamp in values) {
          let row = rows[timestamp];
          if(row === undefined) {
            row = [stationName, station, timestamp].concat(new Array(varIDs.length).fill("NA"));
            rows[timestamp] = row;
          }
          row[i + 3] = (values[timestamp] || "NA").toString();
        }
      }
      let rowData = Object.values(rows).sort((a: string[], b: string[]) => {
        return a[2] < b[2] ? -1 : 1;
      });
      data = data.concat(rowData);
    }
    return data;
  }

  private getFileContent(measurements: MeasurementData, varData: VariableMap, stationData: StationMap, constructorF: (measurements: MeasurementData, varData: VariableMap, stationData: StationMap) => string[][]): string {
    let contentArr = constructorF(measurements, varData, stationData);
    let content = contentArr.map((row: string[]) => {
      return `"${row.join("\",\"")}"`;
    }).join("\n");
    return content;
  }

  json2csv(measurements: MeasurementData, varData: VariableData[], stationData: StationData[], mode: number): FileData[] {
    //convert var and station data arrays to maps
    let varMap: VariableMap = {};
    let stationMap: StationMap = {};
    for(let variable of varData) {
      varMap[variable.var_id] = variable;
    }
    for(let station of stationData) {
      stationMap[station.site_id] = station;
    }
    let data: FileData[] = [];
    let constructorF = (mode & PackageModeFlags.CSV_STYLE_MASK) == PackageModeFlags.TABLE ? this.constructTable : this.constructMatrix;
    if((mode & PackageModeFlags.NUM_FILES_MASK) == PackageModeFlags.MULTI) {
      for(let station in measurements) {
        let singleMeasurements: MeasurementData = {};
        singleMeasurements[station] = measurements[station];
        let content = this.getFileContent(singleMeasurements, varMap, stationMap, constructorF);
        let fileData: FileData = {
          fname: `${station}.csv`,
          content: content,
        }
        data.push(fileData);
      }
    }
    else {
      let content = this.getFileContent(measurements, varMap, stationMap, constructorF);
      let fileData: FileData = {
        fname: `data.csv`,
        content: content,
      }
      data.push(fileData);
    }
    return data;
  }

  json2data(measurements: MeasurementData, mode: number): FileData[] {
    let data: FileData[] = [];
    if((mode & PackageModeFlags.NUM_FILES_MASK) == PackageModeFlags.MULTI) {
      data = [];
      for(let station in measurements) {
        data.push({
          fname: `${station}.json`,
          content: JSON.stringify(measurements[station], null, 4),
        });
      }
    }
    else {
      data.push({
        fname: `data.json`,
        content: JSON.stringify(measurements, null, 4),
      });
    }
    return data;
  }
}

export enum PackageModeFlags {
  SINGLE = 0,
  MULTI = 1,
  TABLE = 0,
  MATRIX = 1 << 1,
  NUM_FILES_MASK = 1,
  CSV_STYLE_MASK = 1 << 1
}

interface VariableMap {
  [varID: string]: VariableData
}

interface StationMap {
  [stationID: string]: StationData
}