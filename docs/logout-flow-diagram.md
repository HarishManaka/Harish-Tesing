# Logout Flow Diagram

## Complete Logout Process Flow

```mermaid
flowchart TD
    Start([User Initiates Logout]) --> Source{Logout Source?}
    
    Source -->|Header Dropdown| HD[renderAuthDropdown.js]
    Source -->|Auth Modal| AC[renderAuthCombine.js]
    Source -->|Account Pages| AP[Account Page Components]
    Source -->|Session Timeout| ST[handleUserAuthentication]
    
    HD --> PreserveCart[cacheLoggedInUserCart<br/>Save cart items to session]
    AC --> RevokeToken
    AP --> RevokeToken
    ST --> RevokeToken
    
    PreserveCart --> RevokeToken[authApi.revokeCustomerToken<br/>GraphQL Mutation]
    
    RevokeToken --> TokenSuccess{Token Revoked?}
    
    TokenSuccess -->|Success| RemoveCookies[Remove Cookies<br/>- auth_dropin_user_token<br/>- auth_dropin_firstname]
    TokenSuccess -->|Failed| LogError[Log Error<br/>Continue with cleanup]
    
    RemoveCookies --> EmitEvent[Emit 'authenticated' Event<br/>value: false]
    LogError --> EmitEvent
    
    EmitEvent --> AdobeEvent[Trigger Adobe Data Layer<br/>SIGN_OUT Event]
    
    AdobeEvent --> PostLogout[PostLogoutHandler<br/>- Delete XSRF-TOKEN<br/>- Clear isSuspendedUser]
    
    PostLogout --> CheckRedirect{Check Current Path}
    
    CheckRedirect -->|/customer/*| RedirectLogin[Redirect to<br/>/customer/login]
    CheckRedirect -->|/order-details| RedirectHome[Redirect to<br/>Homepage /]
    CheckRedirect -->|/checkout| RedirectCheckout[Redirect to<br/>/customer/login?redirect_url=/checkout]
    CheckRedirect -->|Other Pages| ReloadPage[Reload Current Page]
    
    RedirectLogin --> UpdateUI
    RedirectHome --> UpdateUI
    RedirectCheckout --> UpdateUI
    ReloadPage --> UpdateUI
    
    UpdateUI[Update UI Components<br/>via 'authenticated' event] --> End([Logout Complete])
```

## Cart Preservation Flow

```mermaid
flowchart LR
    subgraph "During Logout"
        A[User Cart Data] --> B[cacheLoggedInUserCart]
        B --> C[Extract Cart Items]
        C --> D[Format Items<br/>- SKU<br/>- Quantity<br/>- Options]
        D --> E[Store in Session<br/>LOGGEDIN_USER_CART_ITEMS]
    end
    
    subgraph "After Logout (Guest Session)"
        F[Page Load] --> G[restoreCartForGuestSession]
        G --> H{Cart Data Exists?}
        H -->|Yes| I[addProductsToCart API]
        H -->|No| J[Skip Restoration]
        I --> K{Success?}
        K -->|Yes| L[Remove Temp Storage]
        K -->|No| M[Log Error]
    end
    
    E -.->|Session Storage| G
```

## Token Revocation Detail

```mermaid
sequenceDiagram
    participant UI as UI Component
    participant API as authApi
    participant GQL as GraphQL Server
    participant Cookie as Cookie Storage
    participant Event as Event Bus
    participant ACDL as Adobe Data Layer
    
    UI->>API: revokeCustomerToken()
    API->>GQL: POST mutation REVOKE_CUSTOMER_TOKEN
    GQL-->>API: { result: true }
    
    alt Success
        API->>Cookie: Remove auth_dropin_user_token
        API->>Cookie: Remove auth_dropin_firstname
        API->>Event: emit('authenticated', false)
        API->>ACDL: push(SIGN_OUT event)
        API-->>UI: { success: true }
    else Failure
        API->>console: error('revokeCustomerToken failed')
        API-->>UI: { success: false, message }
    end
```

## State Cleanup Flow

```mermaid
flowchart TB
    subgraph "PostLogoutHandler Cleanup"
        Start[PostLogoutHandler Called] --> Cookie[deleteCookie 'XSRF-TOKEN']
        Cookie --> Session[sessionStorage.removeItem 'isSuspendedUser']
        Session --> Complete[Cleanup Complete]
    end
    
    subgraph "Cookie Deletion Process"
        DelStart[deleteCookie Function] --> SetExp[Set Expiry to Past Date]
        SetExp --> Domain[Apply to .nasm.org domain]
        Domain --> Path[Set path to /]
        Path --> Remove[Browser Removes Cookie]
    end
```

## UI Update Flow

```mermaid
flowchart TD
    Logout[Logout Completed] --> EmitAuth[Emit 'authenticated' false]
    
    EmitAuth --> Multiple{Multiple Listeners}
    
    Multiple --> Header[Header Component]
    Multiple --> Nav[Navigation Component]
    Multiple --> Cart[Cart Component]
    Multiple --> Account[Account Components]
    
    Header --> HUpdate[Update Login Button<br/>Show 'Sign In' icon]
    Nav --> NUpdate[Hide Account Menu<br/>Show Login Link]
    Cart --> CUpdate[Switch to Guest Cart]
    Account --> AUpdate[Redirect to Login]
    
    HUpdate --> UIComplete[UI Fully Updated]
    NUpdate --> UIComplete
    CUpdate --> UIComplete
    AUpdate --> UIComplete
```

## Error Handling Flow

```mermaid
flowchart TD
    Error[Error During Logout] --> Type{Error Type?}
    
    Type -->|Token Revocation Failed| TokenFail[Log Error<br/>Continue Cleanup]
    Type -->|Cart Save Failed| CartFail[Silent Failure<br/>Continue Logout]
    Type -->|Network Error| NetFail[Local Logout Only]
    
    TokenFail --> Cleanup[Execute PostLogoutHandler]
    CartFail --> Cleanup
    NetFail --> Cleanup
    
    Cleanup --> LocalClean[Clear Local State<br/>- Cookies<br/>- Session Storage]
    LocalClean --> UserOut[User Logged Out Locally]
```

## Session Timeout Flow

```mermaid
flowchart TD
    Check[handleUserAuthentication] --> GetToken[Check XSRF-TOKEN Cookie]
    
    GetToken --> Exists{Token Exists?}
    
    Exists -->|No| Redirect[Redirect to Login]
    Exists -->|Yes| ParseToken[Parse Token JWT]
    
    ParseToken --> CalcAge[Calculate Token Age]
    
    CalcAge --> Old{Age > 1 hour?}
    
    Old -->|Yes| AutoLogout[Automatic Logout]
    Old -->|No| Continue[Continue Session]
    
    AutoLogout --> DeleteToken[deleteCookie 'XSRF-TOKEN']
    DeleteToken --> RevokeAPI[authApi.revokeCustomerToken]
    RevokeAPI --> LoginRedirect[Redirect to Login Page]
```