package com.intothepicture.domain.userphoto.storage;

import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.doThrow;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.transaction.support.TransactionSynchronizationManager;

class AfterCommitFileDeletionTest {
    private final FileStorage storage = org.mockito.Mockito.mock(FileStorage.class);
    private final AfterCommitFileDeletion deletion = new AfterCommitFileDeletion(storage);

    @AfterEach
    void clearSynchronization() {
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.clearSynchronization();
        }
    }

    @Test
    void waitsForCommitBeforeDeletingThePhysicalFile() throws Exception {
        TransactionSynchronizationManager.initSynchronization();

        deletion.schedule("u/1/photo.jpg");

        verify(storage, never()).delete("u/1/photo.jpg");
        TransactionSynchronizationManager.getSynchronizations().forEach(sync -> sync.afterCommit());
        verify(storage).delete("u/1/photo.jpg");
    }

    @Test
    void rollbackDoesNotDeleteThePhysicalFile() throws Exception {
        TransactionSynchronizationManager.initSynchronization();

        deletion.schedule("u/1/photo.jpg");

        // Spring invokes afterCompletion(ROLLED_BACK), never afterCommit.
        TransactionSynchronizationManager.getSynchronizations().forEach(sync ->
            sync.afterCompletion(org.springframework.transaction.support.TransactionSynchronization.STATUS_ROLLED_BACK));
        verify(storage, never()).delete("u/1/photo.jpg");
    }

    @Test
    void storageFailureAfterCommitDoesNotTurnTheCommittedDeletionIntoAnApiFailure() throws Exception {
        TransactionSynchronizationManager.initSynchronization();
        doThrow(new java.io.IOException("storage unavailable")).when(storage).delete("u/1/photo.jpg");

        deletion.schedule("u/1/photo.jpg");

        TransactionSynchronizationManager.getSynchronizations().forEach(sync -> sync.afterCommit());
        verify(storage).delete("u/1/photo.jpg");
    }
}
