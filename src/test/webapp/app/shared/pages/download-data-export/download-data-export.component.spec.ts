import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DownloadDataExportComponent } from '../../../../../../main/webapp/app/shared/pages/download-data-export/download-data-export.component';

describe('DownloadDataExportComponent', () => {
  let component: DownloadDataExportComponent;
  let fixture: ComponentFixture<DownloadDataExportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DownloadDataExportComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DownloadDataExportComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
