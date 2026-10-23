package info.mm.debate.ai;

import java.util.Collection;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

/** Die Modelle aus {@code debate.ai.models}, nachschlagbar über den Namen hinter dem @. */
@Component
public class AiModels {

	private final Map<String, AiModel> byName;

	@Autowired
	AiModels(AiProperties properties) {
		this(properties.models().entrySet().stream()
			.map(entry -> new AiModel(entry.getKey(), entry.getValue().displayName(), entry.getValue().provider(),
					entry.getValue().version()))
			.toList());
	}

	private AiModels(Collection<AiModel> models) {
		this.byName = models.stream()
			.collect(Collectors.toUnmodifiableMap(model -> model.name().toLowerCase(Locale.ROOT), Function.identity()));
	}

	/** Für Tests. */
	public static AiModels of(AiModel... models) {
		return new AiModels(List.of(models));
	}

	/** Groß- und Kleinschreibung ist egal: {@code @Grok} ruft dasselbe Modell wie {@code @grok}. */
	public Optional<AiModel> find(String name) {
		return Optional.ofNullable(byName.get(name.toLowerCase(Locale.ROOT)));
	}

	public List<AiModel> all() {
		return byName.values().stream().sorted(Comparator.comparing(AiModel::name)).toList();
	}

}
