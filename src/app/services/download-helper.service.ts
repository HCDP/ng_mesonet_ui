import { Injectable } from '@angular/core';
import { saveAs } from 'file-saver';
import mime from "mime";
import { FileData } from './req.service';

@Injectable({
  providedIn: 'root'
})
export class DownloadHelperService {

  constructor() { }

  download(fileData: FileData): void {
    const blob = new Blob([fileData.data], {type: mime.getType(fileData.fname) || undefined});
    saveAs(blob, fileData.fname);
  }
}

