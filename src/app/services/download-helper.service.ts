import { Injectable } from '@angular/core';
import { saveAs } from 'file-saver';
import mime from "mime";
import JSZip from "jszip";

@Injectable({
  providedIn: 'root'
})
export class DownloadHelperService {

  constructor() { }

  private async createZip(data: FileData[], packageName: string): Promise<void> {
    let zip = new JSZip();
    for(let item of data) {
      zip.file(item.fname, item.content);
    }
    const blob = await zip.generateAsync({type:"blob"});
    saveAs(blob, packageName);
  }

  private createFile(data: FileData): void {
    const mimeType = mime.getType(data.fname || "") || undefined;
    const blob = new Blob([data.content], {type: mimeType})
    saveAs(blob, data.fname);
  }
  
  public download(data: FileData[]): void {
    if(data.length == 1) {
      this.createFile(data[0]);
    }
    else if(data.length > 1) {
      this.createZip(data, "data.zip");
    }
  }
}

export interface FileData {
  fname: string,
  content: string
}
