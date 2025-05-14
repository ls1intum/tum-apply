import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { faCoffee } from '@fortawesome/free-solid-svg-icons';

import { TagComponent } from './tag.component';

describe('TagComponent', () => {
  let fixture: ComponentFixture<TagComponent>;
  let component: TagComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TagComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TagComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('renders the supplied text', () => {
    component.text = 'Hello World';
    fixture.detectChanges();

    const textEl: HTMLElement = fixture.debugElement.query(By.css('.text')).nativeElement;
    expect(textEl.textContent).toContain('Hello World');
  });

  it('reflects the "color" input on the underlying <p-tag>', () => {
    component.color = 'success';
    fixture.detectChanges();

    const tagDebug = fixture.debugElement.query(By.css('p-tag'));
    expect(tagDebug.attributes['ng-reflect-severity']).toBe('success');
  });

  it('shows a left icon when icon is set and iconRight is false', () => {
    component.icon = faCoffee;
    component.iconRight = false;
    fixture.detectChanges();

    expect(fixture.debugElement.query(By.css('fa-icon.icon.left'))).toBeTruthy();
    expect(fixture.debugElement.query(By.css('fa-icon.icon.right'))).toBeNull();
  });

  it('shows a right icon when iconRight is true', () => {
    component.icon = faCoffee;
    component.iconRight = true;
    fixture.detectChanges();

    expect(fixture.debugElement.query(By.css('fa-icon.icon.right'))).toBeTruthy();
    expect(fixture.debugElement.query(By.css('fa-icon.icon.left'))).toBeNull();
  });

  it('adds rounded styles when round is true', () => {
    component.round = true;
    fixture.detectChanges();

    expect(fixture.debugElement.query(By.css('.p-tag-rounded'))).toBeTruthy();
  });

  it('renders no icon element when no icon is supplied', () => {
    component.icon = undefined;
    fixture.detectChanges();

    expect(fixture.debugElement.query(By.css('fa-icon'))).toBeNull();
  });
});
