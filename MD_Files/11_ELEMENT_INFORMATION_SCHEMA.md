# 11 - Element Information Schema

## Element Data Payload Specification

The `extractElementData(element)` function produces a comprehensive JSON telemetry object. Below is the complete schema definition and sample payload.

---

## Schema Field Breakdown

```typescript
interface ElementInspectionPayload {
  tag: string;                       // Uppercase tag name (e.g. "BUTTON")
  selector: string;                  // Unique CSS Selector path
  xpath: string;                     // XPath query expression
  classes: string[];                 // List of CSS class names
  
  general: {
    tagName: string;                 // Tag name string
    id: string;                      // Element ID or "N/A"
    classList: string[];             // Array of classes
    textContent: string;             // Truncated clean inline text content
    innerHTML: string;               // Truncated inner HTML
    outerHTML: string;               // Truncated outer HTML
    fullOuterHTML: string;           // Complete untruncated outer HTML
    value: string;                   // Input value or "N/A"
    name: string;                    // Name attribute or "N/A"
    type: string;                    // Type attribute or "N/A"
    placeholder: string;             // Placeholder text or "N/A"
    title: string;                   // Title text or "N/A"
    href: string;                    // Anchor link URL or "N/A"
    src: string;                     // Media source URL or "N/A"
    alt: string;                     // Image alt attribute or "N/A"
    role: string;                    // ARIA role attribute or "N/A"
    ariaAttributes: Record<string, string>; // Map of all aria-* attributes
    tabIndex: number;                // Tab index integer
    isContentEditable: boolean;      // Content editable status
    disabled: boolean;               // Element disabled status
    required: boolean;               // Form input required status
    hidden: boolean;                 // Element visibility status
  };

  dom: {
    parentTag: string;               // Parent element tag name
    parentId: string;                // Parent element ID
    parentClasses: string[];         // Parent element classes
    childrenCount: number;           // Total count of immediate child elements
    childTags: string[];             // Unique array of child element tag names
    previousSiblingTag: string;      // Tag name of previous sibling or "None"
    nextSiblingTag: string;          // Tag name of next sibling or "None"
    depth: number;                   // Node depth level relative to document root
  };

  attributes: Record<string, string>; // Complete key-value map of HTML attributes

  styles: {
    layout: LayoutStyles;
    spacing: SpacingStyles;
    typography: TypographyStyles;
    colors: ColorStyles;
    border: BorderStyles;
    flexGrid: FlexGridStyles;
  };

  specialDetails: Record<string, any>; // Tag-specific details (Images, Links, Buttons, Inputs)
  rawCss: string;                     // Formatted CSS rule block string
}
```

---

## Sample Extracted JSON Payload

```json
{
  "tag": "BUTTON",
  "selector": "main#app > div.container > button.btn-primary",
  "xpath": "//*[@id=\"app\"]/div/button[1]",
  "classes": ["btn", "btn-primary", "active"],
  "general": {
    "tagName": "BUTTON",
    "id": "submitBtn",
    "classList": ["btn", "btn-primary", "active"],
    "textContent": "Submit Feedback",
    "innerHTML": "<span>Submit Feedback</span>",
    "outerHTML": "<button id=\"submitBtn\" class=\"btn btn-primary active\"><span>Submit Feedback</span></button>",
    "fullOuterHTML": "<button id=\"submitBtn\" class=\"btn btn-primary active\"><span>Submit Feedback</span></button>",
    "value": "N/A",
    "name": "submit_action",
    "type": "submit",
    "placeholder": "N/A",
    "title": "Click to submit form",
    "href": "N/A",
    "src": "N/A",
    "alt": "N/A",
    "role": "button",
    "ariaAttributes": {
      "aria-label": "Submit Feedback Form",
      "aria-disabled": "false"
    },
    "tabIndex": 0,
    "isContentEditable": false,
    "disabled": false,
    "required": false,
    "hidden": false
  },
  "dom": {
    "parentTag": "form",
    "parentId": "feedbackForm",
    "parentClasses": ["form-wrapper"],
    "childrenCount": 1,
    "childTags": ["span"],
    "previousSiblingTag": "input",
    "nextSiblingTag": "None",
    "depth": 5
  },
  "attributes": {
    "id": "submitBtn",
    "class": "btn btn-primary active",
    "type": "submit",
    "name": "submit_action",
    "title": "Click to submit form",
    "aria-label": "Submit Feedback Form"
  },
  "styles": {
    "layout": {
      "width": "140px",
      "height": "40px",
      "display": "flex",
      "position": "relative",
      "boxSizing": "border-box"
    },
    "spacing": {
      "margin": "10px 0px 10px 0px",
      "padding": "8px 16px 8px 16px",
      "gap": "8px"
    },
    "typography": {
      "fontFamily": "Inter, system-ui, sans-serif",
      "fontSize": "14px",
      "fontWeight": "600",
      "lineHeight": "20px",
      "textAlign": "center"
    },
    "colors": {
      "textColor": "rgb(255, 255, 255) (#ffffff)",
      "backgroundColor": "rgb(59, 130, 246) (#3b82f6)",
      "borderColor": "rgb(37, 99, 235) (#2563eb)",
      "boxShadow": "0px 4px 12px rgba(59, 130, 246, 0.4)"
    },
    "border": {
      "borderWidth": "1px 1px 1px 1px",
      "borderRadius": "8px",
      "borderStyle": "solid",
      "borderColor": "rgb(37, 99, 235)"
    },
    "flexGrid": {
      "display": "flex",
      "flexDirection": "row",
      "justifyContent": "center",
      "alignItems": "center"
    }
  },
  "specialDetails": {
    "type": "BUTTON",
    "buttonType": "submit",
    "isDisabled": false,
    "formId": "feedbackForm"
  },
  "rawCss": "  display: flex;\n  width: 140px;\n  height: 40px;\n  margin: 10px 0px;\n  padding: 8px 16px;\n  font-family: Inter, system-ui, sans-serif;\n  font-size: 14px;\n  font-weight: 600;\n  color: rgb(255, 255, 255);\n  background-color: rgb(59, 130, 246);\n  border-radius: 8px;\n  box-shadow: 0px 4px 12px rgba(59, 130, 246, 0.4);"
}
```
