# Upload Documents

In this guide, you will learn how to upload documents (such as CVs, reference letters, or transcripts) as part of your application. The upload component is embedded in various steps of the application form and supports drag-and-drop, renaming, deletion, and automatic validation.

---

## Where to Find It

The `jhi-upload-button` is integrated into each relevant step of the application form:

- Transcript (Bachelor and Master) upload → **Step 2**
- CV and Reference upload → **Step 3**

Each upload slot is labeled clearly and supports **PDF files up to 1 MB**.

---

## Uploading a Document

1. **Click on the Upload Area**
   Click anywhere in the upload card to open a file picker.
   Alternatively, drag and drop your `.pdf` file directly into the box.

   ![Upload Area Screenshot](upload-area.png)

2. **Select a File**
   Choose a `.pdf` file from your computer. You may select multiple files if needed.

   > ⚠️ Files must be **less than 1 MB** each.

3. **Review Pending Files**
   Once selected, your file(s) will be shown in a table as _pending upload_, marked with a yellow cloud icon. as long as the upload is taking.

   - You can rename the file after uploading.
   - Click the **X** button to remove it from the pending list.

   Example:

   | Icon | File Name   | Size      | Action |
   | ---- | ----------- | --------- | ------ |
   | 🟡   | `My_CV.pdf` | `0.42 MB` | ❌     |

4. **Automatic Upload**
   As soon as the file is added, it will be uploaded in the background. Upon success, the file icon changes to a green checkmark:

   \| ✅ | `My_CV.pdf` | `0.42 MB` | 🗑️ |

5. **Uploaded Document Actions**
   Once uploaded, you can:

   - **Rename** the document (press Enter or click away to save).
   - **Delete** it using the trash icon.

---

## Deleting Documents

- Use the **trash icon** to delete previously uploaded documents.
- There exists an endpoint to delete all files of a specific type programmatically via the API.

---

## Upload Errors

If an error occurs:

- An alert message will appear.
- The file will not be listed in the table.
- Common reasons:

  - File is larger than the upload limit
  - Incorrect file format (only `.pdf` is accepted)
  - Network or server issues

**Fix:** Adjust the file and try again.

---

## UI Features

| Feature                   | Description                                             |
| ------------------------- | ------------------------------------------------------- |
| **Drag-and-drop support** | Drop PDF files directly into the component.             |
| **Auto-upload**           | Files are automatically uploaded after selection.       |
| **Live rename**           | Click on file name to rename uploaded or pending files. |
| **Validation**            | Max size of 1MB per file; only PDFs accepted.           |
| **State indicators**      | Yellow = pending, Green = uploaded                      |
| **Tooltip help**          | Hover over icons for explanation.                       |

---

## Developer Notes

- This component uses [`p-fileupload`](https://primefaces.org/primeng/fileupload) in **custom upload mode**.
- The upload is triggered via:

  ```ts
  this.applicationService.uploadDocuments(applicationId, documentType, files);
  ```

- Documents are tracked using `DocumentInformationHolderDTO`.
- Uploaded files are stored via backend REST endpoints.

---

## Related Components

| Component                                 | Purpose                  |
| ----------------------------------------- | ------------------------ |
| `application-creation-page2.component.ts` | Upload transcript        |
| `application-creation-page3.component.ts` | Upload CV and references |
| `ApplicationResourceService`              | Backend upload handler   |
