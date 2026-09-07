/**
 * This file is generated from the backend OpenAPI 3 document.
 * Run `npm run codegen:api` to update it when backend changes.
 */

export interface paths {
  "/api/v1/auth/register": {
    post: {
      requestBody: {
        content: {
          "application/json": components["schemas"]["RegisterRequest"];
        };
      };
      responses: {
        201: {
          content: {
            "application/json": components["schemas"]["AuthResponse"];
          };
        };
        400: {
          content: {
            "application/json": components["schemas"]["ApiError"];
          };
        };
      };
    };
  };
  "/api/v1/auth/login": {
    post: {
      requestBody: {
        content: {
          "application/json": components["schemas"]["LoginRequest"];
        };
      };
      responses: {
        200: {
          content: {
            "application/json": components["schemas"]["AuthResponse"];
          };
        };
        400: {
          content: {
            "application/json": components["schemas"]["ApiError"];
          };
        };
      };
    };
  };
  "/api/v1/auth/refresh": {
    post: {
      requestBody: {
        content: {
          "application/json": components["schemas"]["RefreshTokenRequest"];
        };
      };
      responses: {
        200: {
          content: {
            "application/json": components["schemas"]["AuthResponse"];
          };
        };
        400: {
          content: {
            "application/json": components["schemas"]["ApiError"];
          };
        };
      };
    };
  };
  "/api/v1/auth/me": {
    get: {
      responses: {
        200: {
          content: {
            "application/json": {
              userId: string;
              organisationId: string;
              email: string;
              fullName: string;
              role: "OWNER" | "STAFF";
            };
          };
        };
      };
    };
  };
  "/api/v1/organisation/profile": {
    get: {
      responses: {
        200: {
          content: {
            "application/json": components["schemas"]["Organisation"];
          };
        };
      };
    };
    put: {
      requestBody: {
        content: {
          "application/json": components["schemas"]["UpdateOrganisationProfileRequest"];
        };
      };
      responses: {
        200: {
          content: {
            "application/json": components["schemas"]["Organisation"];
          };
        };
      };
    };
  };
  "/api/v1/organisation/logo": {
    post: {
      responses: {
        201: {
          content: {
            "application/json": {
              objectKey: string;
            };
          };
        };
      };
    };
    get: {
      responses: {
        200: {
          content: {
            "image/*": Blob;
          };
        };
      };
    };
    delete: {
      responses: {
        204: never;
      };
    };
  };
  "/api/v1/customers": {
    get: {
      parameters?: {
        query?: {
          query?: string;
          isArchived?: boolean;
          page?: number;
          size?: number;
        };
      };
      responses: {
        200: {
          content: {
            "application/json": {
              content: components["schemas"]["CustomerResponse"][];
              totalElements: number;
              totalPages: number;
              size: number;
              number: number;
            };
          };
        };
      };
    };
    post: {
      requestBody: {
        content: {
          "application/json": components["schemas"]["CreateCustomerRequest"];
        };
      };
      responses: {
        201: {
          content: {
            "application/json": components["schemas"]["CustomerResponse"];
          };
        };
      };
    };
  };
  "/api/v1/customers/{id}": {
    get: {
      parameters: {
        path: {
          id: string;
        };
      };
      responses: {
        200: {
          content: {
            "application/json": components["schemas"]["CustomerResponse"];
          };
        };
      };
    };
    put: {
      parameters: {
        path: {
          id: string;
        };
      };
      requestBody: {
        content: {
          "application/json": components["schemas"]["UpdateCustomerRequest"];
        };
      };
      responses: {
        200: {
          content: {
            "application/json": components["schemas"]["CustomerResponse"];
          };
        };
      };
    };
    delete: {
      parameters: {
        path: {
          id: string;
        };
      };
      responses: {
        200: {
          content: {
            "application/json": components["schemas"]["CustomerResponse"];
          };
        };
      };
    };
  };
  "/api/v1/customers/{id}/archive": {
    post: {
      parameters: {
        path: {
          id: string;
        };
      };
      responses: {
        200: {
          content: {
            "application/json": components["schemas"]["CustomerResponse"];
          };
        };
      };
    };
  };
  "/api/v1/customers/{id}/unarchive": {
    post: {
      parameters: {
        path: {
          id: string;
        };
      };
      responses: {
        200: {
          content: {
            "application/json": components["schemas"]["CustomerResponse"];
          };
        };
      };
    };
  };
  "/api/v1/invoices/drafts": {
    post: {
      requestBody: {
        content: {
          "application/json": components["schemas"]["CreateDraftInvoiceRequest"];
        };
      };
      responses: {
        201: {
          content: {
            "application/json": components["schemas"]["InvoiceResponse"];
          };
        };
      };
    };
  };
  "/api/v1/invoices/drafts/{id}": {
    put: {
      parameters: {
        path: {
          id: string;
        };
      };
      requestBody: {
        content: {
          "application/json": components["schemas"]["UpdateDraftInvoiceRequest"];
        };
      };
      responses: {
        200: {
          content: {
            "application/json": components["schemas"]["InvoiceResponse"];
          };
        };
      };
    };
    delete: {
      parameters: {
        path: {
          id: string;
        };
      };
      responses: {
        204: {
          content: never;
        };
      };
    };
  };
  "/api/v1/invoices/{id}/issue": {
    post: {
      parameters: {
        path: {
          id: string;
        };
      };
      responses: {
        200: {
          content: {
            "application/json": components["schemas"]["InvoiceResponse"];
          };
        };
      };
    };
  };
  "/api/v1/invoices/{id}/cancel": {
    post: {
      parameters: {
        path: {
          id: string;
        };
      };
      requestBody: {
        content: {
          "application/json": components["schemas"]["CancelInvoiceRequest"];
        };
      };
      responses: {
        200: {
          content: {
            "application/json": components["schemas"]["InvoiceResponse"];
          };
        };
      };
    };
  };
  "/api/v1/invoices/{id}": {
    get: {
      parameters: {
        path: {
          id: string;
        };
      };
      responses: {
        200: {
          content: {
            "application/json": components["schemas"]["InvoiceResponse"];
          };
        };
      };
    };
  };
  "/api/v1/invoices": {
    get: {
      parameters: {
        query?: {
          state?: "DRAFT" | "ISSUED" | "CANCELLED";
          customerId?: string;
          fromDate?: string;
          toDate?: string;
          search?: string;
          page?: number;
          size?: number;
        };
      };
      responses: {
        200: {
          content: {
            "application/json": {
              content: components["schemas"]["InvoiceSummaryResponse"][];
              totalElements: number;
              totalPages: number;
              size: number;
              number: number;
            };
          };
        };
      };
    };
  };
  "/api/v1/invoices/{invoiceId}/receipts": {
    post: {
      parameters: {
        path: {
          invoiceId: string;
        };
      };
      requestBody: {
        content: {
          "application/json": components["schemas"]["CreateReceiptRequest"];
        };
      };
      responses: {
        201: {
          content: {
            "application/json": components["schemas"]["ReceiptResponse"];
          };
        };
      };
    };
    get: {
      parameters: {
        path: {
          invoiceId: string;
        };
      };
      responses: {
        200: {
          content: {
            "application/json": components["schemas"]["ReceiptResponse"][];
          };
        };
      };
    };
  };
  "/api/v1/receipts/{receiptId}/reverse": {
    post: {
      parameters: {
        path: {
          receiptId: string;
        };
      };
      requestBody: {
        content: {
          "application/json": components["schemas"]["ReverseReceiptRequest"];
        };
      };
      responses: {
        200: {
          content: {
            "application/json": components["schemas"]["ReceiptResponse"];
          };
        };
      };
    };
  };
  "/api/v1/receipts": {
    get: {
      parameters: {
        query?: {
          invoiceId?: string;
          customerId?: string;
          fromDate?: string;
          toDate?: string;
          paymentMethod?: "CASH" | "UPI" | "NEFT" | "RTGS" | "IMPS" | "CHEQUE" | "CARD";
          isReversed?: boolean;
          page?: number;
          size?: number;
        };
      };
      responses: {
        200: {
          content: {
            "application/json": {
              content: components["schemas"]["ReceiptResponse"][];
              totalElements: number;
              totalPages: number;
              size: number;
              number: number;
            };
          };
        };
      };
    };
  };
  "/api/v1/health": {
    get: {
      responses: {
        200: {
          content: {
            "application/json": {
              status: string;
              service: string;
              version: string;
              timestamp: string;
            };
          };
        };
      };
    };
  };
  "/api/v1/invoices/{invoiceId}/credit-notes": {
    get: {
      parameters: {
        path: {
          invoiceId: string;
        };
      };
      responses: {
        200: {
          content: {
            "application/json": components["schemas"]["CreditNoteResponse"][];
          };
        };
      };
    };
    post: {
      parameters: {
        path: {
          invoiceId: string;
        };
      };
      requestBody: {
        content: {
          "application/json": components["schemas"]["CreateCreditNoteRequest"];
        };
      };
      responses: {
        201: {
          content: {
            "application/json": components["schemas"]["CreditNoteResponse"];
          };
        };
      };
    };
  };
  "/api/v1/credit-notes": {
    get: {
      parameters: {
        query?: {
          state?: "ISSUED" | "CANCELLED";
          originalInvoiceId?: string;
          customerId?: string;
          fromDate?: string;
          toDate?: string;
          search?: string;
          page?: number;
          size?: number;
        };
      };
      responses: {
        200: {
          content: {
            "application/json": {
              content: components["schemas"]["CreditNoteSummaryResponse"][];
              totalElements: number;
              totalPages: number;
              size: number;
              number: number;
            };
          };
        };
      };
    };
  };
  "/api/v1/credit-notes/{id}": {
    get: {
      parameters: {
        path: {
          id: string;
        };
      };
      responses: {
        200: {
          content: {
            "application/json": components["schemas"]["CreditNoteResponse"];
          };
        };
      };
    };
  };
  "/api/v1/credit-notes/{id}/cancel": {
    post: {
      parameters: {
        path: {
          id: string;
        };
      };
      requestBody: {
        content: {
          "application/json": components["schemas"]["CancelCreditNoteRequest"];
        };
      };
      responses: {
        200: {
          content: {
            "application/json": components["schemas"]["CreditNoteResponse"];
          };
        };
      };
    };
  };
}

export interface components {
  schemas: {
    RegisterRequest: {
      legalName: string;
      tradeName?: string;
      email: string;
      password: string;
      fullName: string;
      gstin?: string;
      stateCode?: string;
      pan?: string;
    };
    LoginRequest: {
      email: string;
      password: string;
    };
    RefreshTokenRequest: {
      refreshToken: string;
    };
    AuthResponse: {
      accessToken: string;
      refreshToken: string;
      tokenType: string;
      expiresInSeconds: number;
      user: {
        id: string;
        email: string;
        fullName: string;
        role: "OWNER" | "STAFF";
      };
      organisation: {
        id: string;
        legalName: string;
        tradeName?: string;
        gstin?: string;
        stateCode?: string;
      };
    };
    Organisation: {
      id: string;
      legalName: string;
      tradeName?: string;
      gstin?: string;
      pan?: string;
      addressLine1?: string;
      addressLine2?: string;
      city?: string;
      stateCode?: string;
      pincode?: string;
      country: string;
      phone?: string;
      email?: string;
      logoObjectKey?: string;
      invoicePrefix: string;
      bankAccountName?: string;
      bankAccountNumber?: string;
      bankIfsc?: string;
      bankName?: string;
      bankBranch?: string;
      upiId?: string;
      defaultTermsText?: string;
      defaultCreditDays: number;
      createdAt: string;
      updatedAt: string;
    };
    UpdateOrganisationProfileRequest: {
      legalName: string;
      tradeName?: string;
      gstin?: string;
      pan?: string;
      addressLine1?: string;
      addressLine2?: string;
      city?: string;
      stateCode?: string;
      pincode?: string;
      country?: string;
      phone?: string;
      email?: string;
      invoicePrefix: string;
      bankAccountName?: string;
      bankAccountNumber?: string;
      bankIfsc?: string;
      bankName?: string;
      bankBranch?: string;
      upiId?: string;
      defaultTermsText?: string;
      defaultCreditDays?: number;
    };
    CreateCustomerRequest: {
      legalName: string;
      tradeName?: string;
      gstin?: string;
      pan?: string;
      isRegistered?: boolean;
      billingAddressLine1?: string;
      billingAddressLine2?: string;
      billingCity?: string;
      billingStateCode: string;
      billingPincode?: string;
      shippingAddressLine1?: string;
      shippingAddressLine2?: string;
      shippingCity?: string;
      shippingStateCode?: string;
      shippingPincode?: string;
      contactPerson?: string;
      phone?: string;
      email?: string;
      defaultPlaceOfSupplyStateCode?: string;
      creditDays?: number;
      notes?: string;
    };
    UpdateCustomerRequest: {
      legalName: string;
      tradeName?: string;
      gstin?: string;
      pan?: string;
      isRegistered?: boolean;
      billingAddressLine1?: string;
      billingAddressLine2?: string;
      billingCity?: string;
      billingStateCode: string;
      billingPincode?: string;
      shippingAddressLine1?: string;
      shippingAddressLine2?: string;
      shippingCity?: string;
      shippingStateCode?: string;
      shippingPincode?: string;
      contactPerson?: string;
      phone?: string;
      email?: string;
      defaultPlaceOfSupplyStateCode?: string;
      creditDays?: number;
      notes?: string;
    };
    CustomerResponse: {
      id: string;
      organisationId: string;
      legalName: string;
      tradeName?: string;
      gstin?: string;
      pan?: string;
      isRegistered: boolean;
      billingAddressLine1?: string;
      billingAddressLine2?: string;
      billingCity?: string;
      billingStateCode: string;
      billingPincode?: string;
      shippingAddressLine1?: string;
      shippingAddressLine2?: string;
      shippingCity?: string;
      shippingStateCode?: string;
      shippingPincode?: string;
      contactPerson?: string;
      phone?: string;
      email?: string;
      defaultPlaceOfSupplyStateCode?: string;
      creditDays: number;
      notes?: string;
      isArchived: boolean;
      createdAt: string;
      updatedAt: string;
    };
    InvoiceLineRequest: {
      lineNumber?: number;
      itemDescription: string;
      hsnOrSacCode?: string;
      isService?: boolean;
      quantity: number | string;
      unitOfMeasure?: string;
      unitPrice: number | string;
      discountPercent?: number | string;
      discountAmount?: number | string;
      taxCategory?: 'TAXABLE' | 'NIL_RATED' | 'EXEMPT' | 'ZERO_RATED' | 'NON_GST';
      taxRatePercent: number | string;
    };
    CreateDraftInvoiceRequest: {
      customerId: string;
      invoiceDate: string;
      deliveryOrAcceptanceDate?: string;
      agreedCreditDays?: number;
      placeOfSupplyStateCode?: string;
      isReverseCharge?: boolean;
      poNumber?: string;
      poDate?: string;
      notes?: string;
      termsText?: string;
      lines?: components["schemas"]["InvoiceLineRequest"][];
    };
    UpdateDraftInvoiceRequest: {
      customerId: string;
      invoiceDate: string;
      deliveryOrAcceptanceDate?: string;
      agreedCreditDays?: number;
      placeOfSupplyStateCode?: string;
      isReverseCharge?: boolean;
      poNumber?: string;
      poDate?: string;
      notes?: string;
      termsText?: string;
      lines?: components["schemas"]["InvoiceLineRequest"][];
    };
    CancelInvoiceRequest: {
      reason: string;
    };
    InvoiceLineResponse: {
      id: string;
      lineNumber: number;
      itemDescription: string;
      hsnOrSacCode?: string;
      isService: boolean;
      quantity: string;
      unitOfMeasure: string;
      unitPrice: string;
      grossAmount: string;
      discountPercent: string;
      discountAmount: string;
      taxableValue: string;
      taxCategory: 'TAXABLE' | 'NIL_RATED' | 'EXEMPT' | 'ZERO_RATED' | 'NON_GST';
      taxRatePercent: string;
      cgstRatePercent: string;
      cgstAmount: string;
      sgstRatePercent: string;
      sgstAmount: string;
      igstRatePercent: string;
      igstAmount: string;
      cessRatePercent: string;
      cessAmount: string;
      lineTotal: string;
    };
    TaxSlabSummary: {
      taxRatePercent: string;
      taxableValue: string;
      cgstAmount: string;
      sgstAmount: string;
      igstAmount: string;
      cessAmount: string;
      totalTax: string;
    };
    InvoiceResponse: {
      id: string;
      organisationId: string;
      customerId: string;
      customerLegalName: string;
      customerGstin?: string;
      seriesId?: string;
      invoiceNumber?: string;
      previewInvoiceNumber?: string;
      financialYear?: number;
      financialYearShort?: string;
      invoiceDate: string;
      dueDate: string;
      placeOfSupplyStateCode: string;
      supplyType: 'INTRA_STATE' | 'INTER_STATE' | 'EXPORT';
      isReverseCharge: boolean;
      deliveryOrAcceptanceDate?: string;
      agreedCreditDays: number;
      collectionReference?: string;
      poNumber?: string;
      poDate?: string;
      notes?: string;
      termsText?: string;
      subtotalBeforeDiscount: string;
      totalDiscount: string;
      taxableValue: string;
      totalCgst: string;
      totalSgst: string;
      totalIgst: string;
      totalCess: string;
      totalTax: string;
      roundOff: string;
      grandTotal: string;
      amountInWords?: string;
      state: 'DRAFT' | 'ISSUED' | 'CANCELLED';
      paymentStatus: string;
      totalReceived: string;
      balanceAmount: string;
      ageingBucket?: 'CURRENT' | 'DAYS_1_TO_30' | 'DAYS_31_TO_45' | 'DAYS_46_TO_60' | 'DAYS_61_TO_90' | 'OVER_90';
      issuedAt?: string;
      issuedByUserId?: string;
      cancelledAt?: string;
      cancelledByUserId?: string;
      cancellationReason?: string;
      pdfObjectKey?: string;
      createdAt: string;
      updatedAt: string;
      lines: components["schemas"]["InvoiceLineResponse"][];
      slabSummaries: components["schemas"]["TaxSlabSummary"][];
    };
    InvoiceSummaryResponse: {
      id: string;
      invoiceNumber?: string;
      previewInvoiceNumber?: string;
      invoiceDate: string;
      dueDate: string;
      customerId: string;
      customerLegalName: string;
      grandTotal: string;
      totalReceived: string;
      balanceAmount: string;
      state: 'DRAFT' | 'ISSUED' | 'CANCELLED';
      paymentStatus: string;
      ageingBucket?: 'CURRENT' | 'DAYS_1_TO_30' | 'DAYS_31_TO_45' | 'DAYS_46_TO_60' | 'DAYS_61_TO_90' | 'OVER_90';
      collectionReference?: string;
    };
    CreateReceiptRequest: {
      amount: number | string;
      paymentDate: string;
      paymentMethod: 'CASH' | 'UPI' | 'NEFT' | 'RTGS' | 'IMPS' | 'CHEQUE' | 'CARD';
      referenceNumber?: string;
      notes?: string;
    };
    ReverseReceiptRequest: {
      reason: string;
    };
    ReceiptResponse: {
      id: string;
      organisationId: string;
      invoiceId: string;
      invoiceNumber?: string;
      customerId: string;
      customerLegalName?: string;
      amount: string;
      paymentDate: string;
      paymentMethod: 'CASH' | 'UPI' | 'NEFT' | 'RTGS' | 'IMPS' | 'CHEQUE' | 'CARD';
      referenceNumber?: string;
      notes?: string;
      isReversed: boolean;
      reversalReason?: string;
      reversedAt?: string;
      reversedByUserId?: string;
      reversedByReceiptId?: string;
      createdByUserId?: string;
      createdAt: string;
    };
    CreditNoteReason: "SALES_RETURN" | "POST_SALE_DISCOUNT" | "DEFICIENCY_IN_SERVICE" | "CORRECTION_IN_INVOICE" | "CHANGE_IN_POS_OR_RATE" | "OTHER";
    CreditNoteState: "ISSUED" | "CANCELLED";
    CreateCreditNoteRequest: {
      creditNoteDate: string;
      reason: components["schemas"]["CreditNoteReason"];
      reasonNotes?: string;
      lines: Array<{
        originalInvoiceLineId?: string;
        itemDescription: string;
        hsnSacCode?: string;
        quantity: number | string;
        unitPrice: number | string;
        taxCategory?: "TAXABLE" | "NIL_RATED" | "EXEMPT" | "NON_GST";
        taxRatePercent?: number | string;
        cessRatePercent?: number | string;
      }>;
    };
    CancelCreditNoteRequest: {
      reason: string;
    };
    CreditNoteLineResponse: {
      id: string;
      originalInvoiceLineId?: string;
      itemDescription: string;
      hsnSacCode?: string;
      quantity: string;
      unitPrice: string;
      taxableValue: string;
      taxCategory: string;
      taxRatePercent: string;
      cgstRatePercent: string;
      cgstAmount: string;
      sgstRatePercent: string;
      sgstAmount: string;
      igstRatePercent: string;
      igstAmount: string;
      cessRatePercent: string;
      cessAmount: string;
      totalTaxAmount: string;
      lineTotal: string;
      sortOrder: number;
    };
    CreditNoteResponse: {
      id: string;
      creditNoteNumber: string;
      financialYear: number;
      creditNoteDate: string;
      reason: components["schemas"]["CreditNoteReason"];
      reasonDescription: string;
      reasonNotes?: string;
      originalInvoiceId: string;
      originalInvoiceNumber: string;
      originalInvoiceDate: string;
      customerId: string;
      customerLegalName: string;
      customerGstin?: string;
      taxableValue: string;
      totalCgst: string;
      totalSgst: string;
      totalIgst: string;
      totalCess: string;
      totalTax: string;
      roundOff: string;
      grandTotal: string;
      state: components["schemas"]["CreditNoteState"];
      cancellationReason?: string;
      cancelledAt?: string;
      createdAt: string;
      lines: components["schemas"]["CreditNoteLineResponse"][];
    };
    CreditNoteSummaryResponse: {
      id: string;
      creditNoteNumber: string;
      creditNoteDate: string;
      reason: components["schemas"]["CreditNoteReason"];
      reasonDescription: string;
      originalInvoiceId: string;
      originalInvoiceNumber: string;
      customerId: string;
      customerLegalName: string;
      taxableValue: string;
      totalTax: string;
      grandTotal: string;
      state: components["schemas"]["CreditNoteState"];
      createdAt: string;
    };
    ApiError: {
      code: string;
      message: string;
      timestamp: string;
      fieldErrors?: Array<{
        field: string;
        message: string;
      }>;
    };
  };
}
