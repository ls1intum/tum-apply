import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AtomsModule } from './atoms/atoms.module';
import { MoleculesModule } from './molecules/molecules.module';
import { OrganismsModule } from './organisms/organisms.module';

@NgModule({
  declarations: [],
  imports: [CommonModule],
  exports: [AtomsModule, MoleculesModule, OrganismsModule],
})
export class ComponentsModule {}
