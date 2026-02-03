package com.dearmi.backend.application.search.usecase;

import com.dearmi.backend.application.search.dto.SearchCommand;
import com.dearmi.backend.application.search.dto.SearchResult;

public interface SearchUseCase {

    SearchResult search(SearchCommand command);
}
