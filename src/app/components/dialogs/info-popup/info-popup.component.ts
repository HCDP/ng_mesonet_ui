import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-info-popup',
  standalone: true,
  imports: [MatButtonModule],
  templateUrl: './info-popup.component.html',
  styleUrl: './info-popup.component.scss'
})
export class InfoPopupComponent {
  constructor(public dialogRef: MatDialogRef<InfoPopupComponent>, @Inject(MAT_DIALOG_DATA) public data: string) { }
  
    close() {
      this.dialogRef.close();
    }
}
