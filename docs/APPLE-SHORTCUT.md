# Nomi Apple Shortcut

This recipe creates the Action Button flow:

```text
Action Button → Record Audio → Nomi voice API → Speak response → Record next turn
```

## Pair the phone

1. Sign in to the deployed Nomi PWA.
2. Open **Settings**.
3. Enable **Voice-confirmed transfers**.
4. Under **iPhone Action Button**, tap **Pair Apple Shortcut**.
5. Copy the generated seven-day Shortcut token. Treat it like a temporary password.

The token contains no wallet private key. Revoking Nomi access prevents delegated transfers.

## Build the Shortcut

1. Open Apple’s **Shortcuts** app.
2. Create a new Shortcut named **Nomi**.
3. Add a **Text** action containing the token and name its variable **Shortcut Token**.
4. Add another **Text** action containing the deployed Nomi URL followed by `/api/voice/turn`. Name it **Voice API URL**.
5. Add **Speak Text** with:

   `Hi, I’m Nomi, how can I assist you today?`

6. Add **Repeat 5 Times**. This prevents accidental endless conversations.
7. Inside Repeat, add **Record Audio**:
   - Start Recording: Immediately
   - Finish Recording: After Time
   - Initial duration: 10 seconds
8. Add **Get Contents of URL**:
   - URL: `Voice API URL`
   - Method: POST
   - Request Body: Form
9. Add form fields:
   - `audio`: Recorded Audio
   - `shortcutToken`: Shortcut Token
   - `planToken`: Plan Token, only when the variable has a value
10. Read the returned dictionary:
    - Get `spokenResponse` and use **Speak Text**
    - Get `planToken` and set the **Plan Token** variable
    - Get `requiresUserResponse`
11. If `requiresUserResponse` is false, use **Stop This Shortcut**. Otherwise the Repeat action records the next turn.

## Assign the Action Button

1. Open **Settings → Action Button**.
2. Select **Shortcut**.
3. Choose **Nomi**.

## Test safely

First say:

`What is my OKB balance?`

Then add a contact in Nomi and try:

`Send 0.01 OKB to Alex.`

Nomi should explain the exact plan. Say `Cancel` during the first test. Only test `Yes` after checking that the wallet holds Testnet OKB and the displayed recipient is correct.

## Response fields

The API returns:

- `spokenResponse`
- `requiresUserResponse`
- `transcript`
- `planToken`
- `conversationId`
- `transactionHash`, only after a real broadcast and successful receipt
- `status`

No raw audio is stored by Nomi.
