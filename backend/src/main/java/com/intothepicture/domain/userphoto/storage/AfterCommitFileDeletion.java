package com.intothepicture.domain.userphoto.storage;

import java.io.IOException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

/**
 * Files are external to the database transaction. Deleting them only after a
 * successful commit prevents a rolled-back record deletion from pointing at a
 * file that was already removed.
 */
@Component
public class AfterCommitFileDeletion {
    private static final Logger log = LoggerFactory.getLogger(AfterCommitFileDeletion.class);
    private final FileStorage storage;

    public AfterCommitFileDeletion(FileStorage storage) {
        this.storage = storage;
    }

    public void schedule(String storageKey) {
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    delete(storageKey);
                }
            });
            return;
        }
        delete(storageKey);
    }

    private void delete(String storageKey) {
        try {
            storage.delete(storageKey);
        } catch (IOException exception) {
            // The database is already committed. Keep the logical deletion
            // correct and leave an observable orphan-file cleanup task.
            log.error("Failed to delete committed user-photo storage key: {}", storageKey, exception);
        }
    }
}
