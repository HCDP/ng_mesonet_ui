import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { DownloadFormComponent } from './components/download-form/download-form.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, DownloadFormComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'mesonet_ui';
}
