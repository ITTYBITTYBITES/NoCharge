import { Component, lazy, startTransition, Suspense, useEffect, useState } from 'react';
import type { PropsWithChildren, ReactNode } from 'react';
import type { ArcadeBreakPoint, InteractiveModuleId, InteractiveModuleLoader } from '../content/schemas';
import { ArcadeRuntimeProvider } from './arcade/ArcadeRuntimeProvider';

const lazyModules = new Map<InteractiveModuleId, ReturnType<typeof lazy>>();

function getLazyModule(id: InteractiveModuleId, loadModule: InteractiveModuleLoader) {
  let moduleComponent = lazyModules.get(id);
  if (!moduleComponent) {
    moduleComponent = lazy(loadModule);
    lazyModules.set(id, moduleComponent);
  }
  return moduleComponent;
}

interface BoundaryProps extends PropsWithChildren {
  moduleTitle: string;
}

interface BoundaryState {
  hasError: boolean;
}

class InteractiveErrorBoundary extends Component<BoundaryProps, BoundaryState> {
  state: BoundaryState = { hasError: false };

  static getDerivedStateFromError(): BoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error): void {
    // Keep the user-facing fallback useful without sending content or telemetry.
    console.error(`Interactive module failed to load: ${error.message}`);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="module-error" role="alert">
          <strong>{this.props.moduleTitle} could not start.</strong>
          <p>Reload the page to try again. The instructions and article content are still available above.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

export function InteractiveModuleSlot({
  moduleId,
  moduleLoader,
  title,
  arcadeRuntime,
}: {
  moduleId: InteractiveModuleId;
  moduleLoader: InteractiveModuleLoader;
  title: string;
  arcadeRuntime?: { contentId: string; allowedBreakpoints: readonly ArcadeBreakPoint[] };
}) {
  const ModuleComponent = getLazyModule(moduleId, moduleLoader);
  const [hydrated, setHydrated] = useState(false);

  // renderToString cannot stream a lazy Suspense boundary. Keep the server and
  // first client render identical, then start the module after hydration.
  useEffect(() => {
    // Defer the lazy-module render as a transition so any surrounding static
    // Suspense boundary can finish hydrating before this update is committed.
    startTransition(() => setHydrated(true));
  }, []);

  const moduleContent = !hydrated ? (
    <div className="module-loading" role="status" aria-live="polite">Loading {title}…</div>
  ) : (
    <InteractiveErrorBoundary key={moduleId} moduleTitle={title}>
      <Suspense fallback={<div className="module-loading" role="status" aria-live="polite">Loading {title}…</div>}>
        <ModuleComponent />
      </Suspense>
    </InteractiveErrorBoundary>
  );

  return (
    <section
      className="interactive-viewport"
      aria-label={`${title} interactive area`}
      data-arcade-runtime-contract={arcadeRuntime ? 'nocharge-arcade-v1' : undefined}
    >
      {arcadeRuntime ? (
        <ArcadeRuntimeProvider contentId={arcadeRuntime.contentId} allowedBreakpoints={arcadeRuntime.allowedBreakpoints}>
          {moduleContent}
        </ArcadeRuntimeProvider>
      ) : moduleContent}
    </section>
  );
}
