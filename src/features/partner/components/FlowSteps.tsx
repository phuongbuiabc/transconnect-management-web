import { Icon } from '../../../shared/ui/Icon';

/** Ordered onboarding steps; the current one is announced with aria-current. */
export function FlowSteps({ steps, current }: { steps: string[]; current: number }) {
  return (
    <ol className="flow-steps" aria-label="Các bước tham gia">
      {steps.map((step, index) => {
        const state = index < current ? 'done' : index === current ? 'current' : 'next';
        return (
          <li
            key={step}
            className={'flow-step is-' + state}
            aria-current={state === 'current' ? 'step' : undefined}
          >
            <span className="flow-step-mark" aria-hidden="true">
              {state === 'done' ? <Icon name="check" width={14} height={14} /> : index + 1}
            </span>
            <span>
              {step}
              {state === 'done' ? <span className="sr-only"> (đã xong)</span> : null}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
