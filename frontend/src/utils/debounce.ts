import { useEffect, useMemo } from "react";
import debounce from 'lodash.debounce';

export const useDebouncedEffect = (effect:() => void, cleanup:() => void, deps:any, delay:number = 300) => {
    const debouncedEffect = useMemo(
        () => debounce(effect, delay)
      , deps);

    useEffect(() => {
        debouncedEffect()
        return () => {
            debouncedEffect.cancel()
            cleanup()
        }
    }, [debouncedEffect])


} 
