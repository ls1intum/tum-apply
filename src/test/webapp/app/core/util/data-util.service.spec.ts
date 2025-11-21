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

  describe('openFile', () => {
    it('should open file in new window', () => {
      const newWindow = { ...window };
      // eslint-disable-next-line @typescript-eslint/no-deprecated
      (newWindow.document as any).write = vi.fn();
      window.open = vi.fn(() => newWindow);
      window.URL.createObjectURL = vi.fn();
      
      service.openFile('SkhpcHN0ZXI=', 'text/plain');
      
      expect(window.open).toHaveBeenCalledTimes(1);
    });
  });

  describe('byteSize', () => {
    it.each([
      ['Hello JHipster', 'SGVsbG8gSkhpcHN0ZXI=', '14 bytes'],
      ['abc (no padding)', 'YWJj', '3 bytes'],
      ['ab (single padding)', 'YWI=', '2 bytes'],
      ['a (double padding)', 'YQ==', '1 bytes'],
    ])('should return correct size for %s', (_label, base64, expected) => {
      expect(service.byteSize(base64)).toBe(expected);
    });

    it('should format bytes with thousand separator', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((service as any).formatAsBytes(1234)).toBe('1 234 bytes');
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
