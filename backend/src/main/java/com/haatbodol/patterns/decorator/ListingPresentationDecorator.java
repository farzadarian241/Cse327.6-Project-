package com.haatbodol.patterns.decorator;

import com.haatbodol.model.ListingDto;

import java.text.NumberFormat;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;

/**
 * <h2>Pattern 8: Decorator Pattern — {@code ListingPresentationDecorator}</h2>
 *
 * <p><strong>GoF Participant:</strong> {@code Decorator} (Abstract Decorator) — maintains
 * a reference to a wrapped {@link ListingPresentationComponent} and implements the same
 * component interface by delegating core calls while allowing subclasses to attach
 * additional presentation badges and metadata cleanly.</p>
 */
public abstract class ListingPresentationDecorator implements ListingPresentationComponent {

    /**
     * The inner component wrapped by this decorator layer.
     */
    protected final ListingPresentationComponent wrappedComponent;

    protected ListingPresentationDecorator(ListingPresentationComponent wrappedComponent) {
        this.wrappedComponent = Objects.requireNonNull(
                wrappedComponent,
                "wrappedComponent must not be null"
        );
    }

    @Override
    public ListingDto getBaseListing() {
        return wrappedComponent.getBaseListing();
    }

    @Override
    public Map<String, Object> getDecorators() {
        Map<String, Object> merged = new LinkedHashMap<>(wrappedComponent.getDecorators());
        applyDecoration(merged);
        return merged;
    }

    @Override
    public Map<String, Object> toPresentationMap() {
        Map<String, Object> presentation = new LinkedHashMap<>(wrappedComponent.toPresentationMap());
        presentation.put("decorators", getDecorators());
        return presentation;
    }

    /**
     * Hook method overridden by each concrete decorator to populate its specific badge
     * and metadata entries in the presentation {@code decorators} map.
     *
     * @param decorators mutable copy of the accumulated decorators map
     */
    protected abstract void applyDecoration(Map<String, Object> decorators);

    /**
     * Formats a BDT monetary amount with US comma grouping and the Taka symbol (e.g., {@code ৳58,000}).
     */
    protected static String formatTaka(double amount) {
        NumberFormat nf = NumberFormat.getNumberInstance(Locale.US);
        nf.setMaximumFractionDigits(2);
        return "\u09F3" + nf.format(amount);
    }
}
