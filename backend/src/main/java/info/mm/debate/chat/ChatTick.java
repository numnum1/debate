package info.mm.debate.chat;

import java.util.List;

/** Alles, was in einem Tick in einer Debatte passiert ist. Die Nummern sind pro Debatte lückenlos. */
record ChatTick(String debateId, long tick, List<ChatEvent> events) {
}
