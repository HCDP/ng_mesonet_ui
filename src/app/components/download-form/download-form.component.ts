import { Component } from '@angular/core';
import { PackageParams, ReqService, StationData, VariableData } from "../../services/req.service"
import moment, { Moment } from "moment";
import { FormControl, Validators } from '@angular/forms';
import { ReactiveFormsModule} from '@angular/forms';
import { DownloadHelperService } from '../../services/download-helper.service';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MultiSelectorComponent } from '../multi-selector/multi-selector.component';
import { MatMomentDatetimeModule } from '@mat-datetimepicker/moment';
import { MatDatetimepickerModule } from '@mat-datetimepicker/core';
import { MatDialog } from '@angular/material/dialog';
import { InfoPopupComponent } from '../dialogs/info-popup/info-popup.component';
import { ErrorPopupComponent } from '../dialogs/error-popup/error-popup.component';
import { MatProgressBarModule, ProgressBarMode } from '@angular/material/progress-bar';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-download-form',
  standalone: true,
  imports: [MatProgressBarModule, MatProgressSpinnerModule, MatTooltipModule, ReactiveFormsModule, MatInputModule, MatIconModule, MatButtonModule, CommonModule, MatCheckboxModule, MultiSelectorComponent, MatMomentDatetimeModule, MatDatetimepickerModule, MatSelectModule],
  templateUrl: './download-form.component.html',
  styleUrl: './download-form.component.scss'
})
export class DownloadFormComponent {
  public stations: StationData[] = [];
  public variables: VariableData[] = [];
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
      label: "Matrix",
      description: "A matrix of values for each station in timestamp x variable format.",
      value: "matrix"
    }, {
      label: "Table",
      description: "A table of values for each station, timestamp, and variable.",
      value: "table"
    }]
  };

  startControl = new FormControl<Moment>(moment().subtract(12, "hours"), {updateOn: "blur"});
  endControl = new FormControl<Moment>(moment(), {updateOn: "blur"});
  limitControl = new FormControl<number | null>(null);
  offsetControl = new FormControl<number | null>(null);
  fileFormatControl = new FormControl<"csv" | "json">("csv");
  singleFileControl = new FormControl<boolean>(false);
  csvFormatControl = new FormControl<"table" | "matrix">("matrix");
  emailControl = new FormControl<string>("");
  sendToEmailControl = new FormControl<boolean>(false);
  forceEmail: boolean = false;
  lastValidStart: Moment;
  lastValidEnd: Moment;
  loadData: {
    loading: boolean,
    mode: ProgressBarMode,
    progress: Observable<number> | null
  } = {
    loading: false,
    mode: "query",
    progress: null
  };

  constructor(private reqService: ReqService, private downloadService: DownloadHelperService, public dialog: MatDialog) {
    this.getStationsAndVariables();
    this.emailControl.setValidators(Validators.email);

    this.lastValidStart = this.startControl.value!;
    this.lastValidEnd = this.endControl.value!;

    this.startControl.valueChanges.subscribe((value: Moment | null) => {
      let newValue = null;
      if(!this.startControl.valid || !value) {
        newValue = this.lastValidStart.clone();
      }
      else if(value.isAfter(this.endControl.value)) {
        newValue = this.endControl.value!.clone();
      }
      if(newValue === null) {
        this.lastValidStart = value!;
        this.checkForceEmail();
      }
      else {
        this.startControl.setValue(newValue);
      }
    });

    this.endControl.valueChanges.subscribe((value: Moment | null) => {
      let newValue = null;
      if(!this.endControl.valid || !value) {
        newValue = this.lastValidStart.clone();
      }
      else if(value.isBefore(this.startControl.value)) {
        newValue = this.startControl.value!.clone();
      }
      if(newValue === null) {
        this.lastValidStart = value!;
        this.checkForceEmail();
      }
      else {
        this.endControl.setValue(newValue);
      }
    });
  }

  openDialog(message: string, type: "info" | "error"): void {
    this.dialog.open(type == "info" ? InfoPopupComponent : ErrorPopupComponent, {
      data: message
    });
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
    this.checkForceEmail();
  }

  variablesSelected(variables: VariableData[]) {
    this.selectedVariables = variables;
  }

  private async getStationsAndVariables() {
    try {
      this.stations = await this.reqService.getStations();
      let variableMap: {[variableID: string]: VariableData} = {};
      for(let station of this.stations) {
        if(station.instruments[0].variables) {
          for(let variable of station.instruments[0].variables) {
            variableMap[variable.var_id] = variable;
          }
        }
      }
      this.variables = Object.values(variableMap);
    }
    catch(e) {
      console.log(e);
      this.openDialog("An error occurred while retrieving the mesonet data.", "error");
    }
  }

  validate(): boolean {
    return this.emailControl.valid && this.selectedStations.length > 0 && this.selectedVariables.length > 0 && !this.loadData.loading;
  }

  checkForceEmail() {
    let forceEmail = false;
    console.log(this.selectedStations.length);
    console.log(this.endControl.value!.diff(this.startControl.value, "weeks", true));
    if(this.selectedStations.length > 5 || (this.startControl.value && this.endControl.value && this.endControl.value.diff(this.startControl.value, "weeks", true) > 1)) {
      this.sendToEmailControl.setValue(true);
      forceEmail = true;
    }
    this.forceEmail = forceEmail;
  }

  async submit(): Promise<void> {
    this.loadData.loading = true;
    this.loadData.mode = "query";

    let selectedStationIDs = this.selectedStations.map((station: StationData) => {
      return station.site_id;
    }).join(",");
    let selectedVariableIDs = this.selectedVariables.length == this.variables.length ? undefined : this.selectedVariables.map((variable: VariableData) => {
      return variable.var_id;
    }).join(",");

    let params: PackageParams = {
      station_ids: selectedStationIDs,
      email: this.emailControl.value!,
      combine: this.singleFileControl.value || undefined,
      ftype: this.fileFormatControl.value || undefined,
      csvMode: this.csvFormatControl.value || undefined,
      start_date: this.startControl.value!.utcOffset("-10:00", true).toISOString(),
      end_date: this.endControl.value!.utcOffset("-10:00", true).toISOString(),
      limit: this.limitControl.value || undefined,
      offset: this.offsetControl.value || undefined,
      var_ids: selectedVariableIDs
    };
    
    try{
      if(this.sendToEmailControl.value) {
        await this.reqService.emailDataPackage(params);
        this.openDialog(`A download request has been generated. You should receive an email at ${this.emailControl.value} with your download package shortly. If you do not receive an email within a couple hours, please ensure the email address you entered is spelled correctly and try again or contact the site administrators.`, "info");
      }
      else {
        let data = await this.reqService.getDataPackage(params);
        this.loadData.progress = data.progress;
        this.loadData.mode = "determinate";
        let fileData = await data.fileData;
        this.downloadService.download(fileData);
        this.openDialog("Your download package has been generated. Check your browser for the downloaded data.", "info");
      }
    }
    catch(e) {
      console.log(e);
      this.openDialog("An error occurred while retrieving your data.", "error");

      //need to get error code, check if 404 (gen 404 if no data)
      //this.openDialog("No data was found. Please choose different options and try again.", "info");
    }
    this.loadData.loading = false;
  }
}
