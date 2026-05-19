import os
import sys
import json

# Suppress TensorFlow logging and oneDNN warnings
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'

import numpy as np
import cv2
import tensorflow as tf
from tensorflow.keras.models import Model
from tensorflow.keras.layers import Input, Conv2D, MaxPooling2D, Flatten, Dense, Dropout, Lambda
from tensorflow.keras.optimizers import Adam

def triplet_loss(y_true, y_pred, alpha=0.2):
    anchor, positive, negative = y_pred[:, 0], y_pred[:, 1], y_pred[:, 2]
    pos_dist = tf.reduce_sum(tf.square(anchor - positive), axis=-1)
    neg_dist = tf.reduce_sum(tf.square(anchor - negative), axis=-1)
    loss = tf.maximum(pos_dist - neg_dist + alpha, 0.0)
    return tf.reduce_mean(loss)

def build_triplet_network(input_shape=(150, 400, 1)):
    """Rebuild the exact same architecture used during training."""
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
    x = Lambda(lambda t: tf.math.l2_normalize(t, axis=1), output_shape=(128,), name='l2_norm')(x)

    base_network = Model(input_layer, x, name='base_network')

    input_anchor = Input(shape=input_shape, name='anchor')
    input_positive = Input(shape=input_shape, name='positive')
    input_negative = Input(shape=input_shape, name='negative')

    encoded_anchor = base_network(input_anchor)
    encoded_positive = base_network(input_positive)
    encoded_negative = base_network(input_negative)

    merged_vector = Lambda(lambda t: tf.stack(t, axis=1), output_shape=(3, 128), name='stacked_embeddings')(
        [encoded_anchor, encoded_positive, encoded_negative]
    )
    model = Model(inputs=[input_anchor, input_positive, input_negative], outputs=merged_vector, name='triplet_model')
    model.compile(loss=triplet_loss, optimizer=Adam(learning_rate=1e-4))

    return model

def preprocess_image(path, image_shape=(150, 400), name_gap_threshold=100):
    img_h, img_w = image_shape
    image = cv2.imread(path, cv2.IMREAD_GRAYSCALE)
    if image is None:
        raise ValueError(f"Could not read image: {path}")

    blurred = cv2.GaussianBlur(image, (9, 9), 0)
    _, binary = cv2.threshold(blurred, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
    
    kernel = np.ones((9, 9), np.uint8)
    closing = cv2.morphologyEx(binary, cv2.MORPH_CLOSE, kernel, iterations=10)
    
    contours, _ = cv2.findContours(closing, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    filtered_contours = []
    for contour in contours:
        x, _, w, _ = cv2.boundingRect(contour)
        if w > name_gap_threshold:
            filtered_contours.append(contour)

    # Fallback if filtering removes all contours
    if not filtered_contours:
        if len(contours) > 0:
            filtered_contours = contours
        else:
            # Complete fallback if no contours found
            filtered_contours = [np.array([[[0,0]],[[img_w,0]],[[img_w,img_h]],[[0,img_h]]])]

    x, y, w, h = cv2.boundingRect(cv2.convexHull(np.vstack(filtered_contours)))
    cropped = image[y:y + h, x:x + w]
    resized = cv2.resize(cropped, (img_w, img_h), interpolation=cv2.INTER_LANCZOS4)
    _, resized_binary = cv2.threshold(resized, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    
    return np.expand_dims(resized_binary, axis=-1)

def main():
    if len(sys.argv) != 4:
        print(json.dumps({"success": False, "error": "Usage: python predict.py <model_path> <image1_path> <image2_path>"}))
        sys.exit(1)
        
    model_path = sys.argv[1]
    img1_path = sys.argv[2]
    img2_path = sys.argv[3]
    
    try:
        # Rebuild architecture and load trained weights
        model = build_triplet_network(input_shape=(150, 400, 1))
        model.load_weights(model_path)
        base_network = model.get_layer('base_network')
        
        img1 = preprocess_image(img1_path)
        img2 = preprocess_image(img2_path)
        
        img1 = np.expand_dims(img1, axis=0)
        img2 = np.expand_dims(img2, axis=0)
        
        emb1 = base_network.predict(img1, verbose=0)
        emb2 = base_network.predict(img2, verbose=0)
        
        distance = float(np.linalg.norm(emb1 - emb2))
        
        # Threshold at 0.8
        threshold = 0.8
        is_genuine = distance < threshold
        
        print(json.dumps({
            "success": True,
            "prediction": "Genuine" if is_genuine else "Forged",
            "distance": distance,
            "threshold": threshold
        }))
        
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}))

if __name__ == "__main__":
    main()

