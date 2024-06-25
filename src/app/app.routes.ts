import { Routes } from '@angular/router';
import { DownloadFormComponent } from './components/download-form/download-form.component';

export const routes: Routes = [
    {
        path: "hawaii",
        component: DownloadFormComponent
    },
    {
        path: "american_samoa",
        component: DownloadFormComponent
    },
    {
        path: "**",
        redirectTo: "hawaii"
    }
];
