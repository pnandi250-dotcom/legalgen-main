// src/lib/firebase/firestore.ts
import { collection, addDoc, getDocs, query, where, Timestamp } from "firebase/firestore";
import { db } from "./config";

// This defines the shape of our saved documents
export interface SavedDoc {
    id?: string;
    userId: string;
    title: string;
    htmlContent: string;
    createdAt: Date;
}

// 1. Function to SAVE a document
export async function saveDocumentToDb(userId: string, title: string, htmlContent: string) {
    try {
        const docRef = await addDoc(collection(db, "documents"), {
            userId,
            title,
            htmlContent,
            createdAt: Timestamp.now()
        });
        return docRef.id;
    } catch (error) {
        console.error("Error saving document:", error);
        throw error;
    }
}

// 2. Function to FETCH a user's documents
export async function getUserDocuments(userId: string) {
    try {
        const q = query(collection(db, "documents"), where("userId", "==", userId));
        const querySnapshot = await getDocs(q);

        const docs: SavedDoc[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            docs.push({
                id: doc.id,
                userId: data.userId,
                title: data.title,
                htmlContent: data.htmlContent,
                createdAt: data.createdAt.toDate(), // Convert Firestore timestamp back to JS Date
            });
        });

        // Sort by newest first (avoids needing a custom Firestore index for now)
        return docs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } catch (error) {
        console.error("Error fetching documents:", error);
        return [];
    }
}
import { doc, deleteDoc } from "firebase/firestore"; // 👈 Update your imports at the top if needed

// 3. Function to DELETE a document
export async function deleteDocumentFromDb(docId: string) {
    try {
        const docRef = doc(db, "documents", docId);
        await deleteDoc(docRef);
    } catch (error) {
        console.error("Error deleting document:", error);
        throw error;
    }
}