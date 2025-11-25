import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AlertErrorComponent } from 'app/shared/alert/alert-error.component';
import { AlertService } from 'app/core/util/alert.service';
import { EventManager, EventWithContent } from 'app/core/util/event-manager.service';
import { HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { vi } from 'vitest';
import { createAlertServiceMock, AlertServiceMock, provideAlertServiceMock } from 'util/alert.service.mock';
import { MockEventManager, provideEventManagerMock } from 'util/event-manager.mock';
import { createTranslateServiceMock, provideTranslateMock, TranslateServiceMock } from 'util/translate.mock';

describe('AlertErrorComponent', () => {
  let component: AlertErrorComponent;
  let fixture: ComponentFixture<AlertErrorComponent>;
  let alertService: AlertServiceMock;
  let eventManager: MockEventManager;
  let translate: TranslateServiceMock;

  beforeEach(() => {
    alertService = createAlertServiceMock();
    eventManager = new MockEventManager();
    translate = createTranslateServiceMock();
    TestBed.configureTestingModule({
      imports: [AlertErrorComponent],
      providers: [provideAlertServiceMock(alertService), provideEventManagerMock(eventManager), provideTranslateMock(translate)],
    });
    // Component creation calls subscribe in constructor, so fixture creation must happen here
    fixture = TestBed.createComponent(AlertErrorComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should subscribe to error and httpError events on construction', () => {
    // Subscriptions happen in constructor, which was called in beforeEach
    expect(eventManager.subscribe).toHaveBeenCalledWith('tumApplyApp.error', expect.any(Function));
    expect(eventManager.subscribe).toHaveBeenCalledWith('tumApplyApp.httpError', expect.any(Function));
  });

  it('should call eventManager.destroy on destroy', () => {
    component.ngOnDestroy();
    expect(eventManager.destroy).toHaveBeenCalledTimes(2);
  });

  it('should handle default error with error.message', () => {
    const httpErrorResponse = new HttpErrorResponse({
      error: { message: 'err', params: { foo: 'bar' } },
      status: 400,
      statusText: 'Bad Request',
      url: '/api/test',
    });
    component['addErrorAlert'] = vi.fn();
    component['handleDefaultError'](httpErrorResponse);
    expect(component['addErrorAlert']).toHaveBeenCalledWith('err', 'err', { foo: 'bar' });
  });

  it('should handle fields error in handleFieldsError', () => {
    const httpErrorResponse = new HttpErrorResponse({
      error: {
        fieldErrors: [{ message: 'Min', field: 'foo[1].bar', objectName: 'obj' }],
      },
      status: 400,
      statusText: 'Bad Request',
      url: '/api/test',
    });
    component['addErrorAlert'] = vi.fn();
    component['translateService'].instant = vi.fn(() => 'translatedField');
    component['handleFieldsError'](httpErrorResponse);
    expect(component['addErrorAlert']).toHaveBeenCalledWith('Error on field "translatedField"', 'error.Size', {
      fieldName: 'translatedField',
    });
  });

  it('should handle bad request with fieldErrors', () => {
    const httpErrorResponse = new HttpErrorResponse({
      error: { fieldErrors: [{ message: 'Min', field: 'foo[1].bar', objectName: 'obj' }] },
      status: 400,
      statusText: 'Bad Request',
      url: '/api/test',
      headers: new HttpHeaders(),
    });
    component['addErrorAlert'] = vi.fn();
    component['translateService'].instant = vi.fn(() => 'translatedField');
    component['handleBadRequest'](httpErrorResponse);
    expect(component['addErrorAlert']).toHaveBeenCalledWith('Error on field "translatedField"', 'error.Size', {
      fieldName: 'translatedField',
    });
  });

  it('should handle http error 0 (server not reachable)', () => {
    const response: EventWithContent<any> = { name: 'tumApplyApp.httpError', content: { status: 0 } };
    component['addErrorAlert'] = vi.fn();
    component['handleHttpError'](response);
    expect(component['addErrorAlert']).toHaveBeenCalledWith('Server not reachable', 'error.server.not.reachable');
  });

  it('should handle http error 404 (not found)', () => {
    const response: EventWithContent<any> = { name: 'tumApplyApp.httpError', content: { status: 404 } };
    component['addErrorAlert'] = vi.fn();
    component['handleHttpError'](response);
    expect(component['addErrorAlert']).toHaveBeenCalledWith('Not found', 'error.url.not.found');
  });

  it('should handle http error 400 with app-error header', () => {
    const headers = new HttpHeaders({ 'X-App-Error': 'err', 'X-App-Params': 'entity' });
    const response: EventWithContent<any> = { name: 'tumApplyApp.httpError', content: { status: 400, headers, error: '' } };
    component['addErrorAlert'] = vi.fn();
    component['handleHttpError'](response);
    expect(component['addErrorAlert']).toHaveBeenCalledWith('err', 'err', expect.anything());
  });

  it('should set correct classes for toast and position', () => {
    const alert = { id: '1', type: 'danger', toast: true, position: 'bottom-left', close: vi.fn() } as unknown as any;
    const classes = component.setClasses(alert);
    expect(classes['jhi-toast']).toBe(true);
    expect(classes['bottom-left']).toBe(true);
  });

  it('should call alert.close when close is called', () => {
    const closeFn = vi.fn();
    const alert = { id: '2', type: 'danger', close: closeFn } as unknown as any;
    component.close(alert);
    expect(closeFn).toHaveBeenCalledWith(component.alerts());
  });

  it('should add error alert via alertService when addErrorAlert is called', () => {
    const mockAlerts = component.alerts();
    component['addErrorAlert']('Test Message', 'test.key', { param: 'value' });
    expect(alertService.addAlert).toHaveBeenCalledWith(
      { type: 'danger', message: 'Test Message', translationKey: 'test.key', translationParams: { param: 'value' } },
      mockAlerts,
    );
  });
});
