#!/usr/bin/env python
# coding: utf-8

# In[ ]:


import os
import random
import numpy as np
import cv2
from sklearn.model_selection import train_test_split
from tensorflow.keras.models import Model
from tensorflow.keras.layers import Input, Conv2D, MaxPooling2D, Flatten, Dense, Dropout, Lambda
from tensorflow.keras.optimizers import Adam
import tensorflow as tf
from sklearn.utils import shuffle


# In[ ]:


# Define triplet loss function
def triplet_loss(y_true, y_pred, alpha=0.2):
    anchor, positive, negative = y_pred[:, 0], y_pred[:, 1], y_pred[:, 2]
    pos_dist = tf.reduce_sum(tf.square(anchor - positive), axis=-1)
    neg_dist = tf.reduce_sum(tf.square(anchor - negative), axis=-1)
    loss = tf.maximum(pos_dist - neg_dist + alpha, 0.0)
    return tf.reduce_mean(loss)


# In[ ]:


# Define the triplet network architecture
def build_triplet_network(input_shape=(150, 400, 1)):
    input_layer = Input(shape=input_shape, name='input')

    def conv_block(x, filters, kernel_size, pool_size, name):
        x = Conv2D(filters, kernel_size, activation='relu', padding='same', name=f'{name}_conv')(x)
        x = MaxPooling2D(pool_size, name=f'{name}_pool')(x)
        return x

    x = conv_block(input_layer, 32, (3, 3), (2, 2), 'block1')
    x = conv_block(x, 64, (3, 3), (2, 2), 'block2')
    x = conv_block(x, 128, (3, 3), (2, 2), 'block3')
    x = conv_block(x, 256, (3, 3), (2, 2), 'block4')

    x = Flatten(name='flatten')(x)
    x = Dense(512, activation='relu', name='fc1')(x)
    x = Dropout(0.5, name='dropout1')(x)
    x = Dense(256, activation='relu', name='fc2')(x)
    x = Dropout(0.5, name='dropout2')(x)
    x = Dense(128, activation='relu', name='fc3')(x)
    x = Lambda(lambda x: tf.math.l2_normalize(x, axis=1), name='l2_norm')(x)

    base_network = Model(input_layer, x, name='base_network')

    input_anchor = Input(shape=input_shape, name='anchor')
    input_positive = Input(shape=input_shape, name='positive')
    input_negative = Input(shape=input_shape, name='negative')

    encoded_anchor = base_network(input_anchor)
    encoded_positive = base_network(input_positive)
    encoded_negative = base_network(input_negative)

    merged_vector = Lambda(lambda x: tf.stack(x, axis=1), name='stacked_embeddings')([encoded_anchor, encoded_positive, encoded_negative])
    model = Model(inputs=[input_anchor, input_positive, input_negative], outputs=merged_vector, name='triplet_model')
    model.compile(loss=triplet_loss, optimizer=Adam(learning_rate=1e-4))

    return model


# In[ ]:


# Function to load the BHSig260 dataset and create triplets
def load_dataset(data_dir, num_genuine, num_forged, image_size):
    triplets = []

    # Iterate through each folder (person)
    for person_folder in os.listdir(data_dir):
        person_path = os.path.join(data_dir, person_folder)

        genuine_signatures = []
        forged_signatures = []

        # Load genuine and forged signatures for the person
        for filename in os.listdir(person_path):

            if '-G-' in filename:
                genuine_signatures.append(preprocess_image(os.path.join(person_path, filename), image_size))
            elif '-F-' in filename:
                forged_signatures.append(preprocess_image(os.path.join(person_path, filename), image_size))

        # Randomly select num_genuine genuine signatures and num_forged forged signatures
        selected_genuine = random.sample(genuine_signatures, min(num_genuine, len(genuine_signatures)))
        selected_forged = random.sample(forged_signatures, min(num_forged, len(forged_signatures)))

        # Create triplets
        for i in range(50):
            anchor = random.choice(selected_genuine)
            positive = random.choice(selected_genuine)
            negative = random.choice(selected_forged)
            triplets.append([anchor, positive, negative])

    return np.array(triplets)


# In[ ]:


def load_cedar_dataset(data_dir, image_size=(150, 400)):
    genuine_dir = os.path.join(data_dir, 'full_org')
    forged_dir = os.path.join(data_dir, 'full_forg')

    X_triplets=[]

    for person in range(1, 50):
        genuine_signatures = []
        forged_signatures = []

        for i in range(1, 24):
            genuine_filename = f'original_{person}_{i}.png'
            forged_filename = f'forgeries_{person}_{i}.png'
            genuine_signatures.append(preprocess_image(os.path.join(genuine_dir, genuine_filename), image_size))
            forged_signatures.append(preprocess_image(os.path.join(forged_dir, forged_filename), image_size))

        for i in range(100):
            anchor = random.choice(genuine_signatures)  # Randomly select anchor from genuine signatures
            positive = random.choice(genuine_signatures)  # Randomly select positive from genuine signatures
            negative = random.choice(forged_signatures)  # Randomly select negative from forged signatures
            X_triplets.append([anchor, positive, negative])

    return np.array(X_triplets)


# In[ ]:


def preprocess_image(path, image_shape, name_gap_threshold=100):
    img_h, img_w = image_shape

    # Read the image in grayscale
    image = cv2.imread(path, cv2.IMREAD_GRAYSCALE)

    # Gaussian blurring to remove noise
    blurred = cv2.GaussianBlur(image, (9, 9), 0)

    # Binarization using Otsu's thresholding
    _, binary = cv2.threshold(blurred, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)

    # Morphological closing to fill gaps in the regions
    kernel = np.ones((9, 9), np.uint8)
    closing = cv2.morphologyEx(binary, cv2.MORPH_CLOSE, kernel, iterations=10)

    # Finding contours
    contours, _ = cv2.findContours(closing, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    # Filter contours based on position
    filtered_contours = []
    for contour in contours:
        x, _, w, _ = cv2.boundingRect(contour)
        # Exclude contours that are likely to represent the gap between first and last names
        if w > name_gap_threshold:
            filtered_contours.append(contour)

    # Drawing filtered contours
    contour_image = cv2.cvtColor(image, cv2.COLOR_GRAY2BGR)
    cv2.drawContours(contour_image, filtered_contours, -1, (0, 255, 255), 2)

    # Drawing bounding rectangle
    x, y, w, h = cv2.boundingRect(cv2.convexHull(np.vstack(filtered_contours)))
    rect_image = image.copy()
    cv2.rectangle(rect_image, (x, y), (x + w, y + h), (0, 255, 255), 3)

    # Cropping the image
    cropped = image[y:y + h, x:x + w]

    # Resizing the cropped image
    resized = cv2.resize(cropped, (img_w, img_h), interpolation=cv2.INTER_LANCZOS4)

    # Binarization of resized image
    _, resized_binary = cv2.threshold(resized, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

    return resized_binary


# In[ ]:


# from google.colab import drive
# drive.mount('/content/drive')


# In[ ]:


# Load the BHSig260 dataset and create triplets
data_dir = r'c:\Final year project\SafeSign\dataset\BHSig260-Bengali'
X_sign1 = load_dataset(data_dir, num_genuine=24, num_forged=24, image_size=(150,400))


# In[ ]:


# Load the BHSig260 dataset and create triplets
data_dir = r'c:\Final year project\SafeSign\dataset\CEDAR'
X_sign2 = load_cedar_dataset(data_dir,image_size=(150,400))


# In[ ]:


# Load the BHSig260 dataset and create triplets
data_dir = r'c:\Final year project\SafeSign\dataset\BHSig260-Hindi'
X_sign3 = load_dataset(data_dir, num_genuine=24, num_forged=24, image_size=(150,400))


# In[ ]:


X_sign_combined = np.concatenate((X_sign1, X_sign2, X_sign3), axis=0)
# Shuffle the combined dataset
X_sign = shuffle(X_sign_combined)


# In[ ]:


# Split the dataset into training, validation, and test sets
X_train_val_sign, X_test_sign = train_test_split(X_sign, test_size=0.2, random_state=42)
X_train_sign, X_val_sign = train_test_split(X_train_val_sign, test_size=0.2, random_state=42)


# In[ ]:


# Define the triplet network model
triplet_model = build_triplet_network(input_shape=(150, 400, 1))


# In[ ]:


# Train the model
history = triplet_model.fit(
    [X_train_sign[:, 0], X_train_sign[:, 1], X_train_sign[:, 2]],
    np.zeros((X_train_sign.shape[0], 1)),  # Dummy labels for training
    epochs=25,
    batch_size=32,
    validation_data=(
        [X_val_sign[:, 0], X_val_sign[:, 1], X_val_sign[:, 2]],
        np.zeros((X_val_sign.shape[0], 1))  # Dummy labels for validation
    )
)


# In[ ]:


# Evaluate the model on the test dataset
test_loss = triplet_model.evaluate(
    [X_test_sign[:, 0], X_test_sign[:, 1], X_test_sign[:, 2]],
    np.zeros((X_test_sign.shape[0], 1))  # Dummy labels for testing
)


# In[ ]:


def prepare_image(image_path, target_size=(150, 400)):
    image = preprocess_image(image_path, target_size)
    return np.expand_dims(image, axis=0)


# In[ ]:


def preprocess_image(path, image_shape, name_gap_threshold=100):
    img_h, img_w = image_shape

    # Read the image in grayscale
    image = cv2.imread(path, cv2.IMREAD_GRAYSCALE)

    # Display original image
    display_image("Original Image", image)

    # Gaussian blurring to remove noise
    blurred = cv2.GaussianBlur(image, (9, 9), 0)
    display_image("Blurred Image", blurred)

    # Binarization using Otsu's thresholding
    _, binary = cv2.threshold(blurred, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
    display_image("Binary Image", binary)

    # Morphological closing to fill gaps in the regions
    kernel = np.ones((9, 9), np.uint8)
    closing = cv2.morphologyEx(binary, cv2.MORPH_CLOSE, kernel, iterations=10)
    display_image("Closing Image", closing)

    # Finding contours
    contours, _ = cv2.findContours(closing, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    # Filter contours based on position
    filtered_contours = []
    for contour in contours:
        x, _, w, _ = cv2.boundingRect(contour)
        # Exclude contours that are likely to represent the gap between first and last names
        if w > name_gap_threshold:
            filtered_contours.append(contour)

    # Drawing filtered contours
    contour_image = cv2.cvtColor(image, cv2.COLOR_GRAY2BGR)
    cv2.drawContours(contour_image, filtered_contours, -1, (0, 255, 255), 2)
    display_image("Contour Image", contour_image)

    # Drawing bounding rectangle
    x, y, w, h = cv2.boundingRect(cv2.convexHull(np.vstack(filtered_contours)))
    rect_image = image.copy()
    cv2.rectangle(rect_image, (x, y), (x + w, y + h), (0, 255, 255), 3)
    display_image("Bounding Rectangle Image", rect_image)

    # Cropping the image
    cropped = image[y:y + h, x:x + w]
    display_image("Cropped Image", cropped)

    # Resizing the cropped image
    resized = cv2.resize(cropped, (img_w, img_h), interpolation=cv2.INTER_LANCZOS4)
    display_image("Resized Image", resized)

    # Binarization of resized image
    _, resized_binary = cv2.threshold(resized, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    display_image("Resized Binary Image", resized_binary)

    return resized_binary


# In[ ]:


import matplotlib.pyplot as plt

# Select 3 random triplets from the shuffled dataset
sample_indices = random.sample(range(len(X_sign)), 3)

fig, axes = plt.subplots(3, 3, figsize=(15, 10))
titles = ['Anchor (Genuine)', 'Positive (Genuine)', 'Negative (Forged)']

for i, idx in enumerate(sample_indices):
    for j in range(3):
        axes[i, j].imshow(X_sign[idx][j], cmap='gray')
        if i == 0:
            axes[i, j].set_title(titles[j])
        axes[i, j].axis('off')

plt.tight_layout()
plt.suptitle("Samples of Preprocessed Triplets", fontsize=16, y=1.02)
plt.show()


# In[ ]:


import matplotlib.pyplot as plt
# Assuming 'history' object is available after training the model
train_loss = history.history['loss']
val_loss = history.history['val_loss']
epochs = range(len(train_loss))  # Get the number of epochs

plt.plot(epochs, train_loss, label='Training Loss')
plt.plot(epochs, val_loss, label='Validation Loss')
plt.title('Triplet Network Loss')
plt.xlabel('Epoch')
plt.ylabel('Loss')
plt.legend()
plt.grid()
plt.show()


# In[ ]:


def generate_embeddings(model, data):
    embeddings = model.predict([data[:, 0], data[:, 1], data[:, 2]])
    return embeddings


# In[ ]:


def compute_distances(embeddings):
    anchor_embeddings = embeddings[:, 0]
    positive_embeddings = embeddings[:, 1]
    negative_embeddings = embeddings[:, 2]

    # Compute distances
    positive_distances = np.linalg.norm(anchor_embeddings - positive_embeddings, axis=1)
    negative_distances = np.linalg.norm(anchor_embeddings - negative_embeddings, axis=1)

    return positive_distances, negative_distances


# In[ ]:


# Define function to predict labels based on distances of anchor-positive and anchor-negative pairs
def predict_labels_with_thresholds(positive_distances, negative_distances, threshold):
    predicted_labels_positive = np.zeros(len(positive_distances), dtype=int)
    predicted_labels_negative = np.zeros(len(negative_distances), dtype=int)
    predicted_labels_positive[positive_distances < threshold] = 1
    predicted_labels_negative[negative_distances > threshold] = 1
    return predicted_labels_positive, predicted_labels_negative

# Set the threshold based on the validation loss at epoch 22
threshold = [0.1,0.2,0.3,0.4,0.5,0.6,0.7,0.8,0.9,1.0,1.1,1.2,1.3,1.4]  # Adjust this threshold based on your validation loss

# Generate embeddings for the whole dataset
embeddings = generate_embeddings(triplet_model, X_sign)

# Compute distances for each triplet
positive_distances, negative_distances = compute_distances(embeddings)

accuracy=[]

for i in threshold:
# Determine predicted labels using the threshold
    predicted_labels_positive, predicted_labels_negative = predict_labels_with_thresholds(positive_distances, negative_distances, i)
    count_pos = sum(1 for elem in predicted_labels_positive if elem == 1)
    count_neg = sum(1 for elem in predicted_labels_negative if elem == 1)

# Calculate accuracy
    acc = (count_pos + count_neg) / (len(predicted_labels_positive) + len(predicted_labels_negative))
    accuracy.append(acc)
#     print("Accuracy:", accuracy)


# In[ ]:


import matplotlib.pyplot as plt
plt.plot(threshold, accuracy, marker='o')
plt.title('Accuracy vs Threshold')
plt.xlabel('Threshold')
plt.ylabel('Accuracy')
plt.grid()
plt.show()


# In[ ]:


import matplotlib.pyplot as plt


plt.hist(positive_distances, bins=30, label='Positive Distances')
plt.hist(negative_distances, bins=30, label='Negative Distances')
plt.xlabel('Distance')
plt.ylabel('Frequency')
plt.title('Distribution of Positive and Negative Distances')
plt.legend()
plt.show()


# In[ ]:


total_positives = len(predicted_labels_positive)
total_negatives = len(predicted_labels_negative)

# Assuming 1 represents a correct prediction
correct_positives = np.sum(predicted_labels_positive)
correct_negatives = np.sum(predicted_labels_negative)

total_correct = correct_positives + correct_negatives
accuracy = total_correct / (total_positives + total_negatives)

print("Accuracy:", accuracy)


# In[ ]:


ground_truth_positives = np.ones(len(positive_distances), dtype=int)
ground_truth_negatives = np.ones(len(negative_distances), dtype=int)
predicted_positives = predicted_labels_positive
predicted_negatives = predicted_labels_negative

# Assuming arrays have the same length
num_datapoints = len(ground_truth_positives)

confusion_matrix = np.zeros((2, 2))  # Create a 2x2 confusion matrix

for i in range(num_datapoints):
    if ground_truth_positives[i] == 1:
        if predicted_positives[i] == 1:
          confusion_matrix[0, 0] += 1  # TP
        else:
          confusion_matrix[0, 1] += 1  # FN
    if ground_truth_negatives[i]==1:
        if predicted_negatives[i] == 1:
          confusion_matrix[1, 1] += 1  # TN
        else:
          confusion_matrix[1, 0] += 1  # FP

print(confusion_matrix)


# In[ ]:


import matplotlib.pyplot as plt
import seaborn as sns  # Import Seaborn after installation

class_labels = ["Positive", "Negative"]
plt.figure(figsize=(8, 6))
sns.heatmap(confusion_matrix, annot=True, cmap="YlGnBu", fmt='g',  # Use '.2f' for decimals
            xticklabels=class_labels, yticklabels=class_labels)
plt.xlabel("Predicted Label")
plt.ylabel("True Label")
plt.title("Confusion Matrix")
plt.show()


# Model Summary and Saving

# In[ ]:


# Display the architecture details
print("Model Summary:")
triplet_model.summary()

# Save the entire model to a HDF5 file
model_path = 'signature_triplet_model.h5'
triplet_model.save(model_path)

print(f"\nModel successfully saved to: {model_path}")

