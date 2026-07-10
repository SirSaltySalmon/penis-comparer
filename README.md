# Penis Visualizer

Client-side React app for visualizing a penis to scale.

The app renders an abstract 2D SVG visual with:

- estimated actual-size ruler display,
- optional calibration,
- metric and imperial units,
- shareable URL query parameters,
- default size derived from Veale et al. 2015,
- customizable colors,
- mobile portrait projection where length is measured from pubic bone to furthest tip.

## Development

```powershell
npm install
npm run dev
```

## Verification

```powershell
npm test
npm run build
npm run e2e
```

## Notes

The visual is abstract and non-erotic. The app is not medical advice. Browser physical screen-size detection is not 100% reliable, so scale is estimated until calibrated.
