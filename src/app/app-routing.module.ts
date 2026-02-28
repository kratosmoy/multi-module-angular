import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { HomeComponent } from './core/home/home.component';
import { WorkspaceComponent } from './core/workspace/workspace.component';
import { LoginComponent } from './features/auth/login/login.component';
import { DataExplorerComponent } from './features/data-explorer/data-explorer.component';
import { AuthGuard } from './core/guards/auth.guard';

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'auth/login', component: LoginComponent },
  { path: 'explorer', component: DataExplorerComponent, canActivate: [AuthGuard] },
  { path: 'workspace/:moduleId', component: WorkspaceComponent },
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
