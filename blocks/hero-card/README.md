# Hero Card Block

A flexible hero block with image on the left and content on the right, perfect for promotional banners and feature highlights.

## Features

- **Responsive Layout**: Image left, content right on desktop; stacked on mobile
- **Image Styles**: Circular, square, or rounded image options
- **Theme Support**: Dark, light, and brand color themes
- **Button Styles**: Primary, secondary, and default CTA button styles
- **Accessibility**: Full keyboard navigation and screen reader support

## Usage

### Basic Structure
```
| hero-card |
| heading | Your Heading Text |
| headingType | h2 |
| description | Your description text here |
| image | /path/to/image.jpg |
| imageStyle | circular |
| ctaLink | https://example.com |
| ctaLinkText | Shop Now |
| ctaLinkStyle | primary |
| theme | dark |
```

### Field Options

#### Image Style
- `circular` - Round image with border (default)
- `square` - Square image
- `rounded` - Square image with rounded corners

#### Theme
- `dark` - Dark blue gradient background with white text (default)
- `light` - White background with dark text
- `brand` - Brand purple background with white text

#### CTA Style
- `primary` - Red background button (default)
- `secondary` - Transparent button with white border
- `default` - Yellow/green button with dark text

### Example
```
| hero-card |
| heading | Introducing NASM's New Apparel Partner, Free Spirit! |
| description | Save 30% on versatile, high quality NASM-branded products, plus an extensive catalog of performance tees, sports bras, leggings, shorts, outerwear, and much more. |
| image | /content/dam/nasm/fitness-apparel.jpg |
| imageStyle | circular |
| ctaLink | https://store.nasm.org/apparel |
| ctaLinkText | SHOP NOW |
| ctaLinkStyle | primary |
| theme | dark |
```

## Design

Based on the NASM apparel partner promotional design:
- **Layout**: Horizontal split with image left, content right
- **Styling**: Circular image with subtle border
- **Typography**: Bold heading with descriptive text
- **CTA**: Prominent red button following brand guidelines
- **Background**: Dark gradient for visual impact

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile responsive design
- Accessibility compliant (WCAG 2.1 AA)