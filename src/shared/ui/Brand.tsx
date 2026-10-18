export function Brand({ light = false }: { light?: boolean }) {
  return (
    <span className={'brand ' + (light ? 'brand-light' : '')}>
      <span className="brand-symbol" aria-hidden="true">
        T<span />
      </span>
      <span>
        TransConnect<small>MANAGEMENT</small>
      </span>
    </span>
  );
}
