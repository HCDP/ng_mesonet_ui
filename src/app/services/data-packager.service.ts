import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DataPackagerService {

  constructor() { }

  json2csv(mode: number) {

  }

  json2data(jsonData: any, mode: number) {
    let data = jsonData
    if((mode & PackageModeFlags.NUM_FILES_MASK) == PackageModeFlags.MULTI) {
      data = [];
      for(let station in jsonData) {
        data.push(jsonData[station]);
      }
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