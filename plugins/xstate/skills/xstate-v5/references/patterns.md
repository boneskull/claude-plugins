# XState v5 Common Patterns

## Conditional Actions Pattern

### Using enqueueActions (replaces v4's pure/choose)

```typescript
const machine = createMachine({
  context: {
    count: 0,
    user: null,
    isAdmin: false,
  },
  on: {
    PROCESS: {
      actions: enqueueActions(({ context, event, enqueue, check }) => {
        // Conditional logic at runtime
        if (context.count > 10) {
          enqueue('notifyHighCount');
        }

        // Check guards
        if (check('isAuthenticated')) {
          enqueue('processAuthenticatedUser');

          if (context.isAdmin) {
            enqueue('grantAdminPrivileges');
          }
        } else {
          enqueue('redirectToLogin');
        }

        // Dynamic action selection
        const action = context.count % 2 === 0 ? 'handleEven' : 'handleOdd';
        enqueue(action);

        // Always executed
        enqueue(assign({ lastProcessed: Date.now() }));
      }),
    },
  },
});
```

## Loading States Pattern

### Basic Loading Pattern

```typescript
const fetchMachine = createMachine({
  initial: 'idle',
  context: {
    data: null,
    error: null,
  },
  states: {
    idle: {
      on: {
        FETCH: 'loading',
      },
    },
    loading: {
      entry: assign({ error: null }), // Clear previous errors
      invoke: {
        src: 'fetchData',
        onDone: {
          target: 'success',
          actions: assign({
            data: ({ event }) => event.output,
          }),
        },
        onError: {
          target: 'failure',
          actions: assign({
            error: ({ event }) => event.error,
          }),
        },
      },
    },
    success: {
      on: {
        REFETCH: 'loading',
      },
    },
    failure: {
      on: {
        RETRY: 'loading',
      },
    },
  },
});
```

### With Retry Logic

```typescript
const retryMachine = createMachine({
  context: {
    retries: 0,
    maxRetries: 3,
    data: null,
    error: null,
  },
  states: {
    loading: {
      invoke: {
        src: 'fetchData',
        onDone: {
          target: 'success',
          actions: assign({
            data: ({ event }) => event.output,
            retries: 0, // Reset on success
          }),
        },
        onError: [
          {
            target: 'retrying',
            guard: ({ context }) => context.retries < context.maxRetries,
            actions: assign({
              retries: ({ context }) => context.retries + 1,
            }),
          },
          {
            target: 'failure',
            actions: assign({
              error: ({ event }) => event.error,
            }),
          },
        ],
      },
    },
    retrying: {
      after: {
        1000: 'loading', // Retry after 1 second
      },
    },
    success: {},
    failure: {},
  },
});
```

## Form Validation Pattern

### Multi-field Form Validation

```typescript
const formMachine = setup({
  types: {
    context: {} as {
      fields: {
        email: string;
        password: string;
      };
      errors: {
        email?: string;
        password?: string;
      };
      touched: {
        email: boolean;
        password: boolean;
      };
    },
  },
  guards: {
    isEmailValid: ({ context }) =>
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(context.fields.email),
    isPasswordValid: ({ context }) => context.fields.password.length >= 8,
    isFormValid: ({ context }) =>
      !context.errors.email && !context.errors.password,
  },
}).createMachine({
  initial: 'editing',
  context: {
    fields: { email: '', password: '' },
    errors: {},
    touched: { email: false, password: false },
  },
  states: {
    editing: {
      on: {
        UPDATE_EMAIL: {
          actions: [
            assign({
              fields: ({ context, event }) => ({
                ...context.fields,
                email: event.value,
              }),
              touched: ({ context }) => ({
                ...context.touched,
                email: true,
              }),
            }),
            'validateEmail',
          ],
        },
        UPDATE_PASSWORD: {
          actions: [
            assign({
              fields: ({ context, event }) => ({
                ...context.fields,
                password: event.value,
              }),
              touched: ({ context }) => ({
                ...context.touched,
                password: true,
              }),
            }),
            'validatePassword',
          ],
        },
        SUBMIT: {
          target: 'validating',
        },
      },
    },
    validating: {
      always: [
        {
          target: 'submitting',
          guard: 'isFormValid',
        },
        {
          target: 'editing',
          actions: assign({
            touched: { email: true, password: true },
          }),
        },
      ],
    },
    submitting: {
      invoke: {
        src: 'submitForm',
        input: ({ context }) => context.fields,
        onDone: {
          target: 'success',
        },
        onError: {
          target: 'editing',
          actions: assign({
            errors: ({ event }) => event.error.fieldErrors || {},
          }),
        },
      },
    },
    success: {
      type: 'final',
    },
  },
});
```

## Authentication Flow Pattern

```typescript
const authMachine = createMachine({
  initial: 'checkingAuth',
  context: {
    user: null,
    token: null,
  },
  states: {
    checkingAuth: {
      invoke: {
        src: 'checkStoredAuth',
        onDone: [
          {
            target: 'authenticated',
            guard: ({ event }) => !!event.output.token,
            actions: assign({
              user: ({ event }) => event.output.user,
              token: ({ event }) => event.output.token,
            }),
          },
          {
            target: 'unauthenticated',
          },
        ],
      },
    },
    unauthenticated: {
      on: {
        LOGIN: 'authenticating',
        REGISTER: 'registering',
      },
    },
    authenticating: {
      invoke: {
        src: 'authenticate',
        input: ({ event }) => ({
          email: event.email,
          password: event.password,
        }),
        onDone: {
          target: 'authenticated',
          actions: [
            assign({
              user: ({ event }) => event.output.user,
              token: ({ event }) => event.output.token,
            }),
            'storeAuth',
          ],
        },
        onError: {
          target: 'unauthenticated',
          actions: 'showError',
        },
      },
    },
    registering: {
      // Similar to authenticating
    },
    authenticated: {
      on: {
        LOGOUT: {
          target: 'unauthenticated',
          actions: [assign({ user: null, token: null }), 'clearStoredAuth'],
        },
        TOKEN_EXPIRED: 'refreshing',
      },
    },
    refreshing: {
      invoke: {
        src: 'refreshToken',
        onDone: {
          target: 'authenticated',
          actions: assign({
            token: ({ event }) => event.output.token,
          }),
        },
        onError: {
          target: 'unauthenticated',
          actions: ['clearStoredAuth'],
        },
      },
    },
  },
});
```

## Pagination Pattern

```typescript
const paginationMachine = createMachine({
  context: {
    items: [],
    currentPage: 1,
    totalPages: 0,
    pageSize: 10,
    totalItems: 0,
    isLoading: false,
  },
  initial: 'idle',
  states: {
    idle: {
      on: {
        LOAD_PAGE: {
          target: 'loading',
        },
      },
    },
    loading: {
      entry: assign({ isLoading: true }),
      exit: assign({ isLoading: false }),
      invoke: {
        src: 'fetchPage',
        input: ({ context, event }) => ({
          page: event.page || context.currentPage,
          pageSize: context.pageSize,
        }),
        onDone: {
          target: 'idle',
          actions: assign({
            items: ({ event }) => event.output.items,
            currentPage: ({ event }) => event.output.page,
            totalPages: ({ event }) => event.output.totalPages,
            totalItems: ({ event }) => event.output.totalItems,
          }),
        },
        onError: {
          target: 'error',
        },
      },
    },
    error: {
      on: {
        RETRY: 'loading',
      },
    },
  },
  on: {
    NEXT_PAGE: {
      target: '.loading',
      guard: ({ context }) => context.currentPage < context.totalPages,
      actions: assign({
        currentPage: ({ context }) => context.currentPage + 1,
      }),
    },
    PREV_PAGE: {
      target: '.loading',
      guard: ({ context }) => context.currentPage > 1,
      actions: assign({
        currentPage: ({ context }) => context.currentPage - 1,
      }),
    },
    GO_TO_PAGE: {
      target: '.loading',
      guard: ({ context, event }) =>
        event.page > 0 && event.page <= context.totalPages,
      actions: assign({
        currentPage: ({ event }) => event.page,
      }),
    },
  },
});
```

## Wizard/Stepper Pattern

```typescript
const wizardMachine = createMachine({
  initial: 'step1',
  context: {
    step1Data: null,
    step2Data: null,
    step3Data: null,
  },
  states: {
    step1: {
      initial: 'editing',
      states: {
        editing: {
          on: {
            SAVE: {
              target: 'validated',
              actions: assign({
                step1Data: ({ event }) => event.data,
              }),
            },
          },
        },
        validated: {
          type: 'final',
        },
      },
      onDone: {
        target: 'step2',
      },
    },
    step2: {
      initial: 'editing',
      states: {
        editing: {
          on: {
            SAVE: {
              target: 'validated',
              actions: assign({
                step2Data: ({ event }) => event.data,
              }),
            },
          },
        },
        validated: {
          type: 'final',
        },
      },
      on: {
        BACK: 'step1',
      },
      onDone: {
        target: 'step3',
      },
    },
    step3: {
      initial: 'editing',
      states: {
        editing: {
          on: {
            SAVE: {
              target: 'validated',
              actions: assign({
                step3Data: ({ event }) => event.data,
              }),
            },
          },
        },
        validated: {
          type: 'final',
        },
      },
      on: {
        BACK: 'step2',
      },
      onDone: {
        target: 'review',
      },
    },
    review: {
      on: {
        EDIT_STEP1: 'step1',
        EDIT_STEP2: 'step2',
        EDIT_STEP3: 'step3',
        SUBMIT: 'submitting',
      },
    },
    submitting: {
      invoke: {
        src: 'submitWizard',
        input: ({ context }) => ({
          step1: context.step1Data,
          step2: context.step2Data,
          step3: context.step3Data,
        }),
        onDone: {
          target: 'complete',
        },
        onError: {
          target: 'review',
          actions: 'showError',
        },
      },
    },
    complete: {
      type: 'final',
    },
  },
});
```

## Parallel States Pattern

### Upload/Download Manager

```typescript
const fileManagerMachine = createMachine({
  type: 'parallel',
  context: {
    uploads: [],
    downloads: [],
  },
  states: {
    upload: {
      initial: 'idle',
      states: {
        idle: {
          on: {
            START_UPLOAD: 'uploading',
          },
        },
        uploading: {
          invoke: {
            src: 'uploadFiles',
            onDone: {
              target: 'idle',
              actions: 'addUploadedFiles',
            },
            onError: {
              target: 'uploadError',
            },
          },
        },
        uploadError: {
          on: {
            RETRY_UPLOAD: 'uploading',
            CANCEL_UPLOAD: 'idle',
          },
        },
      },
    },
    download: {
      initial: 'idle',
      states: {
        idle: {
          on: {
            START_DOWNLOAD: 'downloading',
          },
        },
        downloading: {
          invoke: {
            src: 'downloadFiles',
            onDone: {
              target: 'idle',
              actions: 'addDownloadedFiles',
            },
            onError: {
              target: 'downloadError',
            },
          },
        },
        downloadError: {
          on: {
            RETRY_DOWNLOAD: 'downloading',
            CANCEL_DOWNLOAD: 'idle',
          },
        },
      },
    },
  },
});
```

## History States Pattern

### Editor with History

```typescript
const editorMachine = createMachine({
  initial: 'editing',
  context: {
    content: '',
    mode: 'text',
  },
  states: {
    editing: {
      initial: 'text',
      states: {
        text: {
          on: {
            SWITCH_TO_VISUAL: 'visual',
          },
        },
        visual: {
          on: {
            SWITCH_TO_TEXT: 'text',
            OPEN_SETTINGS: '#editor.settings',
          },
        },
        history: {
          type: 'history',
          history: 'shallow',
        },
      },
      on: {
        SAVE: 'saving',
      },
    },
    settings: {
      on: {
        CLOSE: '#editor.editing.history', // Return to previous state
        APPLY: {
          target: '#editor.editing.history',
          actions: 'applySettings',
        },
      },
    },
    saving: {
      invoke: {
        src: 'saveContent',
        onDone: {
          target: 'editing',
        },
        onError: {
          target: 'editing',
          actions: 'showSaveError',
        },
      },
    },
  },
});
```

## Debouncing Pattern

### Search with Debounce

```typescript
const searchMachine = createMachine({
  initial: 'idle',
  context: {
    query: '',
    results: [],
  },
  states: {
    idle: {
      on: {
        SEARCH: {
          target: 'debouncing',
          actions: assign({
            query: ({ event }) => event.query,
          }),
        },
      },
    },
    debouncing: {
      after: {
        300: 'searching', // 300ms debounce
      },
      on: {
        SEARCH: {
          target: 'debouncing',
          actions: assign({
            query: ({ event }) => event.query,
          }),
          reenter: true, // Reset the timer
        },
      },
    },
    searching: {
      invoke: {
        src: 'performSearch',
        input: ({ context }) => ({ query: context.query }),
        onDone: {
          target: 'idle',
          actions: assign({
            results: ({ event }) => event.output,
          }),
        },
        onError: {
          target: 'idle',
          actions: 'logError',
        },
      },
    },
  },
});
```

## Queue Processing Pattern

```typescript
const queueMachine = createMachine({
  context: {
    queue: [],
    currentItem: null,
    processed: [],
    failed: [],
  },
  initial: 'idle',
  states: {
    idle: {
      always: [
        {
          target: 'processing',
          guard: ({ context }) => context.queue.length > 0,
        },
      ],
      on: {
        ADD_TO_QUEUE: {
          actions: assign({
            queue: ({ context, event }) => [...context.queue, event.item],
          }),
          target: 'processing',
        },
      },
    },
    processing: {
      entry: assign({
        currentItem: ({ context }) => context.queue[0],
        queue: ({ context }) => context.queue.slice(1),
      }),
      invoke: {
        src: 'processItem',
        input: ({ context }) => context.currentItem,
        onDone: {
          target: 'idle',
          actions: assign({
            processed: ({ context, event }) => [
              ...context.processed,
              { item: context.currentItem, result: event.output },
            ],
            currentItem: null,
          }),
        },
        onError: {
          target: 'idle',
          actions: assign({
            failed: ({ context, event }) => [
              ...context.failed,
              { item: context.currentItem, error: event.error },
            ],
            currentItem: null,
          }),
        },
      },
    },
  },
  on: {
    CLEAR_QUEUE: {
      actions: assign({
        queue: [],
        processed: [],
        failed: [],
      }),
    },
  },
});
```

## Modal/Dialog Pattern

```typescript
const modalMachine = createMachine({
  initial: 'closed',
  context: {
    data: null,
    result: null,
  },
  states: {
    closed: {
      on: {
        OPEN: {
          target: 'open',
          actions: assign({
            data: ({ event }) => event.data,
          }),
        },
      },
    },
    open: {
      initial: 'idle',
      states: {
        idle: {
          on: {
            CONFIRM: {
              target: 'confirming',
            },
          },
        },
        confirming: {
          invoke: {
            src: 'handleConfirm',
            input: ({ context }) => context.data,
            onDone: {
              actions: [
                assign({
                  result: ({ event }) => event.output,
                }),
                emit({ type: 'MODAL_CONFIRMED' }),
              ],
              target: '#modal.closed',
            },
            onError: {
              target: 'idle',
              actions: 'showError',
            },
          },
        },
      },
      on: {
        CANCEL: {
          target: 'closed',
          actions: [
            assign({ data: null, result: null }),
            emit({ type: 'MODAL_CANCELLED' }),
          ],
        },
        CLOSE: {
          target: 'closed',
          actions: assign({ data: null, result: null }),
        },
      },
    },
  },
});
```

## Connection Management Pattern

```typescript
const connectionMachine = createMachine({
  initial: 'disconnected',
  context: {
    retries: 0,
    maxRetries: 5,
    socket: null,
  },
  states: {
    disconnected: {
      on: {
        CONNECT: 'connecting',
      },
    },
    connecting: {
      invoke: {
        src: 'createConnection',
        onDone: {
          target: 'connected',
          actions: assign({
            socket: ({ event }) => event.output,
            retries: 0,
          }),
        },
        onError: [
          {
            target: 'reconnecting',
            guard: ({ context }) => context.retries < context.maxRetries,
            actions: assign({
              retries: ({ context }) => context.retries + 1,
            }),
          },
          {
            target: 'failed',
          },
        ],
      },
    },
    connected: {
      invoke: {
        src: 'monitorConnection',
        onError: {
          target: 'reconnecting',
        },
      },
      on: {
        DISCONNECT: {
          target: 'disconnected',
          actions: 'closeConnection',
        },
        CONNECTION_LOST: 'reconnecting',
      },
    },
    reconnecting: {
      after: {
        // Exponential backoff
        [({ context }) => Math.min(1000 * Math.pow(2, context.retries), 30000)]:
          'connecting',
      },
    },
    failed: {
      on: {
        RETRY: {
          target: 'connecting',
          actions: assign({ retries: 0 }),
        },
      },
    },
  },
});
```
