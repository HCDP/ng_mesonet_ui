import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { StationSelectComponent } from './components/station-select/station-select.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, StationSelectComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'mesonet_ui';
}
