# PDF Asset Authoring and Publishing Workflow

This diagram summarizes the two main authoring workflows for PDF download buttons in AEM Edge Delivery Services, and the asset publishing/link transformation process.

```mermaid
graph TD
  A["Author in AEM Universal Editor"] --> B1["Add Download Button Block"]
  B1 --> C1["Dynamic Media License?"]
  C1 -- "Yes" --> D1["Use Sidekick Extension to Select PDF"]
  D1 --> E1["Copy Dynamic Media URL"]
  E1 --> F1["Paste URL in Button"]
  F1 --> G["Publish Page"]
  G --> H["PDF Available at Public Dynamic Media URL"]
  C1 -- "No" --> D2["Use Path Picker to Select PDF"]
  D2 --> E2["Internal DAM Path in Button"]
  E2 --> G
  G --> I["Client-Side Script Transforms Path"]
  I --> J["PDF Available at /documents/[filename].pdf"]
  subgraph "EDS Asset Flow"
    K1["PDF in AEM DAM (/content/dam/nasm/documents/)"]
    K1 --> L1["Publishing Service Copies to EDS Media Bus"]
    L1 --> J
  end
``` 