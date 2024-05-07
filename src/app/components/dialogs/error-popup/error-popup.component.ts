import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-error-popup',
  standalone: true,
  imports: [MatButtonModule],
  templateUrl: './error-popup.component.html',
  styleUrl: './error-popup.component.scss'
})
export class ErrorPopupComponent {
  constructor(public dialogRef: MatDialogRef<ErrorPopupComponent>, @Inject(MAT_DIALOG_DATA) public data: string) { }

  reload() {
    window.location.reload();
  }

  close() {
    this.dialogRef.close();
  }
}
