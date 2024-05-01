import { Injectable } from '@angular/core';
import { saveAs } from 'file-saver';
import * as mime from "mime-types";
import JSZip from "jszip";

@Injectable({
  providedIn: 'root'
})
export class DownloadHelperService {

  constructor() { }

  async createZip(data: FileData[], packageName: string) {
    let zip = new JSZip();
    for(let item of data) {
      zip.file(item.fname, item.content);
    }
    const blob = await zip.generateAsync({type:"blob"});
    saveAs(blob, packageName);
  }

  downloadFile(data: FileData) {
    const mimeType = mime.lookup(data.type || "") || undefined;
    const blob = new Blob([data.content], {type: mimeType})
    saveAs(blob, data.fname);
  }
  //give option to zip one file each station or combine to one file
}

interface FileData {
  fname: string,
  content: any,
  type?: string
}
