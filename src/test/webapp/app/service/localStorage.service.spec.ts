import { LocalStorageService, ApplicationDraftData } from 'app/service/localStorage.service';

describe('LocalStorageService', () => {
  let service: LocalStorageService;

  beforeEach(() => {
    service = new LocalStorageService();
    localStorage.clear();
    vi.restoreAllMocks();
  });

  const emptyPersonalInfo: ApplicationDraftData['personalInfoData'] = {
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    dateOfBirth: '',
    website: '',
    linkedIn: '',
    street: '',
    city: '',
    postcode: '',
  };
  const baseDraft: Omit<ApplicationDraftData, 'timestamp'> = {
    personalInfoData: emptyPersonalInfo,
    applicationId: 'A123',
    jobId: 'J999',
  };

  function makeDraft(timestamp: Date): ApplicationDraftData {
    return { ...baseDraft, timestamp: timestamp.toISOString() };
  }

  it('saves application draft with applicationId key', () => {
    const draft = makeDraft(new Date());
    service.saveApplicationDraft(draft);
    const raw = localStorage.getItem('application_draft_A123');
    expect(raw).not.toBeNull();
    if (!raw) throw new Error('Draft not found in localStorage');
    expect(JSON.parse(raw).applicationId).toBe('A123');
  });

  it('saves application draft with jobId when applicationId absent', () => {
    const draftOnlyJob: ApplicationDraftData = {
      personalInfoData: emptyPersonalInfo,
      applicationId: '', // empty string forces jobId fallback
      jobId: 'J123',
      timestamp: new Date().toISOString(),
    };
    service.saveApplicationDraft(draftOnlyJob);
    const raw = localStorage.getItem('application_draft_job_J123');
    expect(raw).not.toBeNull();
    if (!raw) throw new Error('Draft not found in localStorage');
    expect(JSON.parse(raw).jobId).toBe('J123');
  });

  it('loads application draft when not expired', () => {
    const draft = makeDraft(new Date());
    service.saveApplicationDraft(draft);
    const loaded = service.loadApplicationDraft(draft.applicationId, undefined);
    expect(loaded).not.toBeNull();
    if (!loaded) throw new Error('Loaded draft is null');
    expect(loaded.applicationId).toBe('A123');
  });

  it('returns null when draft expired (older than 30 days) and clears it', () => {
    const past = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000);
    const expired = makeDraft(past);
    service.saveApplicationDraft(expired);
    const loaded = service.loadApplicationDraft(expired.applicationId, undefined);
    expect(loaded).toBeNull();
    expect(localStorage.getItem('application_draft_A123')).toBeNull();
  });

  it('clears application draft explicitly', () => {
    const draft = makeDraft(new Date());
    service.saveApplicationDraft(draft);
    service.clearApplicationDraft(draft.applicationId, undefined);
    expect(localStorage.getItem('application_draft_A123')).toBeNull();
  });

  it('throws error when neither applicationId nor jobId provided to load', () => {
    // Access private helper via bracket notation without any cast
    const getApplicationKey = (service as { [key: string]: any })['getApplicationKey'];
    expect(() => getApplicationKey.call(service, undefined, undefined)).toThrowError();
  });

  it('rethrows error when JSON.stringify fails (circular data)', () => {
    const circularPersonal: ApplicationDraftData['personalInfoData'] & { self?: any } = {
      ...emptyPersonalInfo,
    };
    circularPersonal.self = circularPersonal; // circular reference triggers JSON.stringify error
    const draft: ApplicationDraftData = {
      personalInfoData: circularPersonal,
      applicationId: 'AERR',
      jobId: 'JERR',
      timestamp: new Date().toISOString(),
    };
    expect(() => service.saveApplicationDraft(draft)).toThrowError('Failed to save application data locally.');
  });
});
