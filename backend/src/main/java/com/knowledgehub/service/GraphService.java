package com.knowledgehub.service;

import com.knowledgehub.dto.response.GraphResponse;
import com.knowledgehub.entity.Note;
import com.knowledgehub.entity.Tag;
import com.knowledgehub.entity.User;
import com.knowledgehub.repository.NoteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class GraphService {

    private final NoteRepository noteRepository;

    @Transactional(readOnly = true)
    public GraphResponse generateGraph(User user) {
        List<Note> activeNotes = noteRepository.findAllByUserAndIsDeletedFalse(user);

        List<GraphResponse.GraphNode> nodes = new ArrayList<>();
        List<GraphResponse.GraphLink> links = new ArrayList<>();

        Map<Long, Integer> tagCounts = new HashMap<>();

        for (Note note : activeNotes) {
            String noteId = "note-" + note.getId();

            nodes.add(GraphResponse.GraphNode.builder()
                    .id(noteId)
                    .name(note.getTitle() != null && !note.getTitle().isEmpty() ? note.getTitle() : "Untitled Note")
                    .group("note")
                    .val(5) // base size for notes
                    .build());

            for (Tag tag : note.getTags()) {
                tagCounts.put(tag.getId(), tagCounts.getOrDefault(tag.getId(), 0) + 1);

                String tagId = "tag-" + tag.getId();
                links.add(GraphResponse.GraphLink.builder()
                        .source(noteId)
                        .target(tagId)
                        .build());
            }
        }

        // Add tag nodes and scale them by their connection count
        Set<Tag> globalTagsMap = new HashSet<>();
        for (Note note : activeNotes) {
            globalTagsMap.addAll(note.getTags());
        }

        for (Tag tag : globalTagsMap) {
            int count = tagCounts.getOrDefault(tag.getId(), 0);
            nodes.add(GraphResponse.GraphNode.builder()
                    .id("tag-" + tag.getId())
                    .name("#" + tag.getName())
                    .group("tag")
                    .val(8 + (count * 3)) // tags grow dynamically based on how many notes connect to them
                    .build());
        }

        return GraphResponse.builder()
                .nodes(nodes)
                .links(links)
                .build();
    }
}
