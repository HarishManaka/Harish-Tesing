# NASM E-Commerce Blocks Documentation

This comprehensive guide documents all available blocks in the NASM Adobe Edge Delivery Services (EDS) e-commerce project. Each block is designed for specific content types and use cases to help content authors and migration teams quickly identify the right component for their needs.

## Table of Contents

1. [Hero & Banner Blocks](#hero--banner-blocks)
2. [Content Display Blocks](#content-display-blocks)
3. [Interactive Components](#interactive-components)
4. [E-commerce Blocks](#e-commerce-blocks)
5. [NASM-Specific Blocks](#nasm-specific-blocks)
6. [Layout & Navigation](#layout--navigation)
7. [Media Blocks](#media-blocks)
8. [Form & Authentication Blocks](#form--authentication-blocks)
9. [Utility Blocks](#utility-blocks)

---

## Hero & Banner Blocks

### Hero
**Purpose**: Primary hero section for landing pages and key content areas

**Use Cases**:
- Homepage hero sections
- Landing page headers
- Product page introductions
- Campaign headers

**Fields**:
- **Image** (optional): Hero background image
- **Image Alt** (optional): Alt text for accessibility
- **Sup Heading** (optional): Small text above main heading
- **Main Heading** (required): Primary headline text
- **Main Heading Type** (select): HTML heading level (h1-h6)
- **Sub Heading** (optional): Supporting text below main heading
- **CTA** (optional): Call-to-action link
- **CTA Text** (optional): Button text
- **CTA Type** (select): Button style - Primary, Default, or Secondary
- **Theme & Options** (multiselect): Color themes and visual options

**Visual Layout**: Full-width section with image background and overlay content

**Notes**: Most flexible hero component with extensive customization options

### Banner
**Purpose**: Promotional banners and announcements with dual-line titles

**Use Cases**:
- Promotional announcements
- Course highlights
- Special offers
- Section headers

**Fields**:
- **Content Alignment** (select): Left, Center, or Right alignment
- **Title Line 1** (text): First line of title
- **Title Line 1 Color** (select): White, Yellow, Teal, Primary, Purple
- **Title Line 1 Size** (select): Large, Medium, Small
- **Title Line 2** (text): Second line of title
- **Title Line 2 Color** (select): White, Yellow, Teal, Primary, Purple
- **Title Line 2 Size** (select): Large, Medium, Small
- **Description** (text): Supporting description text
- **Description Size** (select): Large, Medium, Small
- **Description Weight** (select): Bold or Regular
- **Description Color** (select): Default, White, Yellow, Teal, Primary, Purple
- **Description Layout** (select): Boxed or Full Width
- **Background Color** (select): White, Gray, Purple, Dark Blue, Transparent
- **Flexible Layout** (boolean): Enable separate lines for title components

**Visual Layout**: Flexible banner with customizable typography and backgrounds

### Hero Stats
**Purpose**: Hero section featuring key statistics and achievements

**Use Cases**:
- Program success rates
- Graduate statistics
- Certification numbers
- Achievement highlights

**Fields**:
- **Background Image** (optional): Hero background image
- **Title** (required): Main heading text
- **Statistic 1 Percentage** (text): First stat number
- **Statistic 1 Description** (text): First stat description
- **Statistic 2 Percentage** (text): Second stat number
- **Statistic 2 Description** (text): Second stat description
- **Statistic 3 Percentage** (text): Third stat number
- **Statistic 3 Description** (text): Third stat description

**Visual Layout**: Hero with overlaid statistics displayed prominently

### Hero USP
**Purpose**: Hero section highlighting unique selling propositions

**Use Cases**:
- Program benefits
- Key features
- Value propositions
- Course highlights

**Fields**:
- **Promo Type** (boolean): Toggle promotional styling
- **Background Color** (select): White, Gray, Purple, Dark Blue, Teal, Transparent

**Items**:
- **Title** (text): USP headline
- **Content Sub Title** (richtext): Supporting description
- **Content Link** (aem-content): Associated call-to-action link

**Visual Layout**: Grid layout with multiple USP items

### Hero Video
**Purpose**: Video-centric hero with promotional content

**Use Cases**:
- Course previews
- Success stories
- Program introductions
- Testimonial videos

**Fields**:
- **Star Rating** (text): 1-5 rating display
- **Rating Label** (text): Rating description
- **Sup Heading** (text): Small text above main heading
- **Main Heading** (required): Primary headline
- **Main Heading Type** (select): HTML heading level (h1-h6)
- **Title Line 2** (text): Second line of title
- **Description** (text): Supporting description
- **CTA Link** (aem-content): Call-to-action URL
- **CTA Button Text** (text): Button label
- **CTA Button Type** (select): Primary, Default, Secondary
- **Price** (text): Price display
- **Price Label** (text): Price description
- **Badge Text** (text): Promotional badge
- **Promotion Label** (text): Special promotion text
- **Video URL** (required): Video file or embed URL
- **Video Poster Image** (optional): Video thumbnail
- **Theme** (select): Default, Red, White, Primary, Accent

**Visual Layout**: Split layout with video player and content overlay

### Hero Video Background
**Purpose**: Full-screen video background with overlay content

**Use Cases**:
- Immersive landing pages
- Brand storytelling
- Course introductions
- Inspirational content

**Fields**: Minimal configuration for video URL and overlay content

### Hero Card
**Purpose**: Card-style hero with circular or square image

**Use Cases**:
- Instructor profiles
- Program highlights
- Testimonials
- Personal stories

**Fields**:
- **Image** (required): Profile or feature image
- **Image Style** (select): Circular, Square, Rounded
- **Heading** (required): Card title
- **Heading Type** (select): HTML heading level (h1-h6)
- **Description** (text): Supporting text
- **CTA Link** (aem-content): Call-to-action URL
- **CTA Button Text** (text): Button label
- **CTA Button Style** (select): Primary, Secondary, Default
- **Theme** (select): Dark, Light, Brand

**Visual Layout**: Centered card with image and content

### Banner CTA
**Purpose**: Call-to-action focused banner

**Use Cases**:
- Course enrollment prompts
- Newsletter signups
- Contact forms
- Special offers

**Fields**: Basic banner with CTA-focused design

---

## Content Display Blocks

### Cards
**Purpose**: Grid layout for displaying multiple content items

**Use Cases**:
- Course listings
- Program overviews
- Staff profiles
- Resource libraries

**Container Fields**:
- **Text** (richtext): Optional header content

**Card Item Fields**:
- **Image** (optional): Card image
- **Text** (richtext): Card content including title and description

**Visual Layout**: Responsive grid of content cards

### Cards Carousel
**Purpose**: Sliding carousel of content cards

**Use Cases**:
- Featured courses
- Student testimonials
- Program highlights
- Success stories

**Container Fields**: No configuration needed

**Carousel Item Fields**:
- **Image** (optional): Card image
- **Image Alt Text** (text): Accessibility text
- **Description** (richtext): Main content
- **Badge** (text): Optional badge text
- **Subtitle** (text): Supporting text

**Visual Layout**: Horizontal scrolling carousel

### Story Carousel
**Purpose**: Testimonial and story carousel with background images

**Use Cases**:
- Student success stories
- Graduate testimonials
- Program reviews
- Case studies

**Container Fields**: No configuration needed

**Story Item Fields**:
- **Background Image** (optional): Story background
- **Image Alt Text** (text): Accessibility text
- **Quote/Testimonial** (richtext): Main testimonial content
- **Person Name** (text): Testimonial author
- **Person Title/Role** (text): Author's title or role

**Visual Layout**: Full-width carousel with background images

### Testimonials
**Purpose**: Customer and student testimonials

**Use Cases**:
- Course reviews
- Program feedback
- Success stories
- Social proof

**Container Fields**:
- **Title** (text): Section title
- **Title Type** (hidden): HTML heading level

**Testimonial Item Fields**:
- **Image** (optional): Person's photo
- **Image Alt** (text): Accessibility text
- **Quote** (text): Testimonial text
- **By Line** (text): Attribution text

**Visual Layout**: Grid or list layout of testimonials

### Facts
**Purpose**: Icon-based fact or feature display

**Use Cases**:
- Program benefits
- Key features
- Statistics
- Quick facts

**Container Fields**: No configuration needed

**Fact Item Fields**:
- **Icon** (reference): Icon image
- **Description** (richtext): Fact description

**Visual Layout**: Grid layout with icons and descriptions

### Columns
**Purpose**: Multi-column layout container

**Use Cases**:
- Side-by-side content
- Comparison layouts
- Feature highlights
- Contact information

**Fields**:
- **Columns** (number): Number of columns
- **Rows** (number): Number of rows

**Visual Layout**: Flexible column grid system

**Supported Content**: Text, Image, Button, Title, ID.me components

---

## Interactive Components

### Accordion
**Purpose**: Collapsible content sections

**Use Cases**:
- FAQ sections
- Course syllabi
- Program details
- Help documentation

**Container Fields**:
- **Title** (text): Accordion section title
- **Title Type** (hidden): HTML heading level
- **Footer** (richtext): Optional footer content

**Accordion Item Fields**:
- **Title** (text): Item heading
- **Title Type** (hidden): HTML heading level
- **Content** (richtext): Expandable content

**Visual Layout**: Stacked collapsible panels

### Tabs
**Purpose**: Tabbed content interface

**Use Cases**:
- Course information sections
- Multi-step processes
- Categorized content
- Feature comparisons

**Container Fields**: No configuration needed

**Tab Item Fields**:
- **Tab Title** (text): Tab label
- **Tab Content** (richtext): Tab content

**Visual Layout**: Horizontal tab navigation with content panels

### Sports Tabs
**Purpose**: NASM-specific tabbed interface for sports and specializations

**Use Cases**:
- Sport-specific training information
- Specialization details
- Program variations
- Certification paths

**Container Fields**: No configuration needed

**Sports Tab Fields**:
- **Tab Title** (text): Sport or specialization name
- **Image** (optional): Related image
- **Image Alt Text** (text): Accessibility text
- **Tab Description** (richtext): Content for the tab

**Visual Layout**: Specialized tab interface for sports content

### Countdown Promo
**Purpose**: Time-sensitive promotional content with countdown timer

**Use Cases**:
- Limited-time offers
- Course enrollment deadlines
- Event countdowns
- Flash sales

**Fields**:
- **Promo Label** (text): Promotional message
- **Text Color** (select): Dark Blue, White, Yellow, Teal, Purple
- **Background Color** (select): White, Gray, Purple, Dark Blue, Teal, Transparent
- **Countdown End Date** (date-time): Countdown target date
- **Show Countdown Timer** (boolean): Enable/disable timer display

**Visual Layout**: Prominent banner with countdown display

---

## E-commerce Blocks

### Product Details
**Purpose**: Adobe Commerce product detail page integration

**Use Cases**:
- Course product pages
- Certification details
- Bundle products
- Digital products

**Fields**: No configuration needed (data from Commerce)

**Visual Layout**: Commerce dropin integration

### Product List Page
**Purpose**: Category and search result pages

**Use Cases**:
- Course catalogs
- Product categories
- Search results
- Filtered listings

**Fields**: No configuration needed (data from Commerce)

### Product List Page Custom
**Purpose**: Enhanced product listing with custom filters

**Use Cases**:
- Advanced course filtering
- Custom product displays
- Specialized catalogs
- Curated collections

**Fields**: Custom filtering and display options

### Product Recommendations
**Purpose**: AI-driven product recommendations

**Use Cases**:
- Related courses
- Upselling
- Cross-selling
- Personalized suggestions

**Fields**: Recommendation algorithm integration

### Product Teaser
**Purpose**: Promotional product preview

**Use Cases**:
- Featured courses
- New product announcements
- Special offers
- Course previews

**Fields**: Product preview configuration

### Payment Plans
**Purpose**: Flexible payment options display

**Use Cases**:
- Course financing options
- Payment plan details
- Pricing flexibility
- Financial aid information

**Fields**: Payment plan configuration

### Flexible Payment CTA
**Purpose**: Call-to-action for flexible payment options

**Use Cases**:
- Payment plan promotions
- Financial assistance
- Custom payment options
- Contact for pricing

**Fields**:
- **Text** (richtext): CTA content and messaging

**Visual Layout**: Prominent CTA section

---

## NASM-Specific Blocks

### Mini Courses
**Purpose**: Display of NASM mini-course offerings

**Use Cases**:
- Continuing education
- Specialized training modules
- Quick learning opportunities
- Skill enhancement courses

**Fields**: No configuration needed (dynamic content)

### Exercise Details
**Purpose**: Exercise database and instruction display

**Use Cases**:
- Exercise library
- Training instructions
- Movement demonstrations
- Fitness routines

**Fields**: No configuration needed (dynamic content)

### Exercise Filter
**Purpose**: Filtering interface for exercise database

**Use Cases**:
- Exercise search
- Movement filtering
- Muscle group selection
- Equipment-based filtering

**Fields**: Filter configuration options

### Health Nutrition Guides
**Purpose**: Health and nutrition resource display

**Use Cases**:
- Nutrition guides
- Health resources
- Educational materials
- Reference content

**Fields**: Guide content configuration

### Validate Credentials
**Purpose**: Professional credential validation

**Use Cases**:
- Certification verification
- Professional validation
- Credential checking
- Certification status

**Fields**: Credential validation interface

### Contact Rep
**Purpose**: Sales representative contact information

**Use Cases**:
- Sales inquiries
- B2B contacts
- Program guidance
- Custom solutions

**Fields**: Representative contact details

---

## Layout & Navigation

### Fragment
**Purpose**: Reusable content fragments

**Use Cases**:
- Shared content sections
- Consistent messaging
- Reusable components
- Content syndication

**Fields**:
- **Reference** (aem-content): Fragment reference

### Marquee
**Purpose**: Scrolling text announcements

**Use Cases**:
- Important announcements
- News updates
- Promotional messages
- Event notifications

**Fields**:
- **Text** (richtext): Scrolling content

### Navigation Level 3
**Purpose**: Third-level navigation component

**Use Cases**:
- Deep navigation structures
- Category navigation
- Detailed site maps
- Hierarchical menus

**Fields**: Navigation structure configuration

---

## Media Blocks

### Video
**Purpose**: General video embedding and display

**Use Cases**:
- Educational videos
- Course previews
- Instructional content
- Promotional videos

**Fields**:
- **Video URL** (required): YouTube, Vimeo, or direct video URL
- **Poster Image** (optional): Video thumbnail
- **Poster Alt Text** (text): Accessibility text
- **Autoplay** (boolean): Enable autoplay with reduced motion respect
- **Video Title** (text): Accessible video title

**Visual Layout**: Responsive video player

### Expanded Carousel
**Purpose**: Full-width carousel with expanded content

**Use Cases**:
- Featured content
- Image galleries
- Product showcases
- Portfolio displays

**Fields**: Enhanced carousel configuration

### Mansory (Masonry)
**Purpose**: Pinterest-style masonry layout

**Use Cases**:
- Image galleries
- Portfolio displays
- Varied content sizes
- Visual storytelling

**Container Fields**: No configuration needed

**Mansory Item Fields**:
- **Image** (reference): Gallery image

**Visual Layout**: Dynamic masonry grid

### Brands
**Purpose**: Logo and brand display

**Use Cases**:
- Partner logos
- Certification badges
- Sponsor displays
- Brand partnerships

**Container Fields**: No configuration needed

**Brand Item Fields**:
- **Image** (reference): Brand logo
- **Image Alt** (text): Accessibility text

**Visual Layout**: Brand logo grid

---

## Form & Authentication Blocks

### HubSpot Form
**Purpose**: HubSpot form integration

**Use Cases**:
- Lead generation
- Contact forms
- Newsletter signup
- Event registration

**Fields**:
- **HubSpot Portal ID** (required): Portal identifier (default: 2494739)
- **HubSpot Form ID** (required): Specific form identifier
- **Target Container ID** (optional): Custom container ID
- **Redirect URL** (optional): Post-submission redirect
- **Show Inline Thank You Message** (boolean): Inline vs redirect thank you

**Integration**: Direct HubSpot API integration

### User Form
**Purpose**: General user input forms

**Use Cases**:
- Custom forms
- Data collection
- User registration
- Feedback forms

**Fields**: Custom form configuration

### Commerce Login
**Purpose**: Adobe Commerce authentication

**Use Cases**:
- Customer login
- Account access
- Order history
- Profile management

**Fields**: Commerce authentication integration

### MFE Login
**Purpose**: Micro-frontend login component

**Use Cases**:
- Single sign-on
- Integrated authentication
- Multi-system login
- Unified user experience

**Fields**: MFE authentication configuration

### Login Nav
**Purpose**: Navigation-based login component

**Use Cases**:
- Header login
- Navigation integration
- Quick access
- User account links

**Fields**: Login navigation configuration

---

## Utility Blocks

### Logo
**Purpose**: Brand logo display

**Use Cases**:
- Header logos
- Footer branding
- Brand identification
- Navigation branding

**Fields**: Logo configuration and styling

### Maintenance Alert
**Purpose**: System maintenance notifications

**Use Cases**:
- Scheduled maintenance
- System updates
- Service interruptions
- Important notices

**Fields**: Alert message and scheduling

### ID.me Badge
**Purpose**: ID.me verification badge display

**Use Cases**:
- Military verification
- First responder discounts
- Student verification
- Professional validation

**Fields**: ID.me integration configuration

### ID.me Verify Button
**Purpose**: ID.me verification trigger button

**Use Cases**:
- Discount verification
- Identity confirmation
- Professional status
- Eligibility checking

**Fields**: Verification button configuration

### Secure Badge
**Purpose**: Security and certification badges

**Use Cases**:
- SSL certificates
- Security assurance
- Trust indicators
- Compliance badges

**Fields**: Badge display configuration

### Enrichment
**Purpose**: Content enrichment for products and categories

**Use Cases**:
- Additional product information
- Category enhancements
- Dynamic content insertion
- Contextual information

**Fields**:
- **Type** (select): Product or Category
- **Position** (select): Above/Below Product or Category

**Integration**: Dynamic content positioning system

---

## Implementation Notes

### Block Patterns
- **Container + Item**: Many blocks use a container with multiple items (Cards, Testimonials, Facts, etc.)
- **Key-Value**: Some blocks use key-value configuration format
- **Filter Systems**: Complex blocks include filtering capabilities
- **Commerce Integration**: E-commerce blocks integrate with Adobe Commerce dropins
- **Responsive Design**: All blocks are mobile-first responsive

### Content Guidelines
- **Required Fields**: Always populate required fields for proper functionality
- **Image Optimization**: Use appropriate image sizes and formats
- **Accessibility**: Include alt text for all images
- **SEO**: Use appropriate heading levels and semantic structure
- **Performance**: Optimize video and large media files

### Migration Considerations
- **Content Mapping**: Map existing content to appropriate block fields
- **Theme Consistency**: Maintain brand consistency across blocks
- **User Experience**: Consider user flow and interaction patterns
- **Mobile Experience**: Test all blocks on mobile devices
- **Performance**: Monitor page load times with multiple blocks

This documentation serves as a comprehensive guide for content authors and migration teams working with the NASM Adobe Edge Delivery Services platform. Each block is designed to provide flexibility while maintaining consistency across the site.