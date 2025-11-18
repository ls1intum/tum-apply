import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { DataUtils } from 'app/core/util/data-util.service';

describe('Data Utils Service Test', () => {
  let service: DataUtils;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [DataUtils],
    });
    service = TestBed.inject(DataUtils);
  });

  describe('byteSize', () => {
    it('should return the bytesize of the text', () => {
      // 'Hello JHipster' in base64 is 'SGVsbG8gSkhpcHN0ZXI='
      expect(service.byteSize('SGVsbG8gSkhpcHN0ZXI=')).toBe('14 bytes');
    });
  });

  describe('openFile', () => {
    it('should open the file in the new window', () => {
      const newWindow = { ...window };
      // eslint-disable-next-line @typescript-eslint/no-deprecated
      (newWindow.document as any).write = (globalThis as any).vi.fn();
      window.open = (globalThis as any).vi.fn(() => newWindow);
      window.URL.createObjectURL = (globalThis as any).vi.fn();
      // 'JHipster' in base64 is 'SkhpcHN0ZXI='
      const data = 'SkhpcHN0ZXI=';
      const contentType = 'text/plain';
      service.openFile(data, contentType);
      expect(window.open).toHaveBeenCalledTimes(1);
    });
  });

  describe('byteSize - additional cases', () => {
    it('should correctly handle no padding', () => {
      // 'abc' -> base64 'YWJj' -> 3 bytes
      expect(service.byteSize('YWJj')).toBe('3 bytes');
    });

    it('should correctly handle single padding', () => {
      // 'ab' -> base64 'YWI=' -> 2 bytes
      expect(service.byteSize('YWI=')).toBe('2 bytes');
    });

    it('should correctly handle double padding', () => {
      // 'a' -> base64 'YQ==' -> 1 byte
      expect(service.byteSize('YQ==')).toBe('1 bytes');
    });

    it('formatAsBytes should add thousand separator', () => {
      // call private method for formatting
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const formatted = (service as any).formatAsBytes(1234);
      expect(formatted).toBe('1 234 bytes');
    });
  });

  describe('loadFileToForm', () => {
    const createMockFile = (type: string, contents = 'Hello') => {
      return new File([contents], 'file.txt', { type });
    };

    class MockFileReader {
      onload: ((e: any) => void) | null = null;
      readAsDataURL(_file: File) {
        // simulate load with a data URL containing base64 'SGVsbG8=' ('Hello')
        this.onload && this.onload({ target: { result: 'data:text/plain;base64,SGVsbG8=' } });
      }
    }

    beforeEach(() => {
      // stub global FileReader
      // @ts-ignore
      global.FileReader = MockFileReader;
    });

    it('should load file to form when file present (non-image)', async () => {
      const file = createMockFile('text/plain');
      const event = { target: { files: [file] } } as unknown as Event;
      const editForm = { patchValue: vi.fn() } as any;

      await firstValueFrom(service.loadFileToForm(event, editForm, 'myField', false));

      expect(editForm.patchValue).toHaveBeenCalledWith({ myField: 'SGVsbG8=', myFieldContentType: 'text/plain' });
    });

    it('should error when image expected but wrong type', async () => {
      const file = createMockFile('text/plain');
      const event = { target: { files: [file] } } as unknown as Event;
      const editForm = { patchValue: vi.fn() } as any;

      await expect(firstValueFrom(service.loadFileToForm(event, editForm, 'f', true))).rejects.toMatchObject({ key: 'not.image' });
    });

    it('should error when no file present', async () => {
      const event = { target: {} } as unknown as Event;
      const editForm = { patchValue: vi.fn() } as any;

      await expect(firstValueFrom(service.loadFileToForm(event, editForm, 'f', false))).rejects.toMatchObject({ key: 'could.not.extract' });
    });
  });
});
