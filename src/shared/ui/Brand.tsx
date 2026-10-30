export function Brand({ light = false }: { light?: boolean }) {
  return (
    <span className={'brand ' + (light ? 'brand-light' : '')}>
      <span className="brand-symbol" aria-hidden="true">
        V<span />
      </span>
      <span>
        VieGo<small>MANAGEMENT</small>
      </span>
    </span>
  );
}
