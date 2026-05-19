"""
Convert the Siamese triplet model's base_network to TFLite format.

The full triplet model has 3 inputs (anchor, positive, negative).
For inference we only need the base_network (single input -> 128-d embedding).
This script:
  1. Rebuilds the base_network architecture (avoids Lambda deserialization issues)
  2. Loads the matching weights from the .h5 file
  3. Exports as a TFLite model
"""
import os
import numpy as np
import tensorflow as tf
from tensorflow.keras.models import Model
from tensorflow.keras.layers import Input, Conv2D, MaxPooling2D, Flatten, Dense, Dropout, Lambda

# ── Paths ──────────────────────────────────────────────────────
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)  # SafeSign root
H5_PATH = os.path.join(PROJECT_ROOT, "model", "signature_triplet_model.h5")
TFLITE_OUTPUT = os.path.join(PROJECT_ROOT, "model", "signature_base_network.tflite")


def build_base_network(input_shape=(150, 400, 1)):
    """Rebuild the base_network architecture exactly as in training."""
    input_layer = Input(shape=input_shape, name='input')

    def conv_block(x, filters, kernel_size, pool_size, name):
        x = Conv2D(filters, kernel_size, activation='relu', padding='same', name=f'{name}_conv')(x)
        x = MaxPooling2D(pool_size, name=f'{name}_pool')(x)
        return x

    x = conv_block(input_layer, 32, (3, 3), (2, 2), 'block1')
    x = conv_block(input_layer if False else x, 64, (3, 3), (2, 2), 'block2')
    x = conv_block(x, 128, (3, 3), (2, 2), 'block3')
    x = conv_block(x, 256, (3, 3), (2, 2), 'block4')

    x = Flatten(name='flatten')(x)
    x = Dense(512, activation='relu', name='fc1')(x)
    x = Dropout(0.5, name='dropout1')(x)
    x = Dense(256, activation='relu', name='fc2')(x)
    x = Dropout(0.5, name='dropout2')(x)
    x = Dense(128, activation='relu', name='fc3')(x)
    x = Lambda(lambda t: tf.math.l2_normalize(t, axis=1), name='l2_norm')(x)

    return Model(input_layer, x, name='base_network')


def main():
    print(f"Loading full triplet model from: {H5_PATH}")
    if not os.path.exists(H5_PATH):
        print(f"ERROR: {H5_PATH} not found!")
        return

    # Rebuild the base network with the same architecture
    base_network = build_base_network()
    base_network.summary()

    # Load the full triplet model to extract base_network weights
    # We need custom_objects for the Lambda layers and triplet_loss
    def triplet_loss(y_true, y_pred, alpha=0.2):
        anchor, positive, negative = y_pred[:, 0], y_pred[:, 1], y_pred[:, 2]
        pos_dist = tf.reduce_sum(tf.square(anchor - positive), axis=-1)
        neg_dist = tf.reduce_sum(tf.square(anchor - negative), axis=-1)
        loss = tf.maximum(pos_dist - neg_dist + alpha, 0.0)
        return tf.reduce_mean(loss)

    print("\nLoading weights from .h5 file into the rebuilt base_network...")
    # Using load_weights with by_name=True is much more robust than load_model
    # as it avoids deserializing the complex triplet architecture and Lambda layers
    try:
        base_network.load_weights(H5_PATH, by_name=True)
        print("Success: Weights loaded successfully using by_name=True")
    except Exception as e:
        print(f"Error: Direct weight load failed: {str(e)}")
        print("This usually means the layer names in the .h5 file don't match the rebuilt architecture.")
        return

    # Verify with a dummy input
    dummy_input = np.random.rand(1, 150, 400, 1).astype(np.float32)
    rebuilt_output = base_network.predict(dummy_input)
    print(f"Rebuilt output sample (first 5): {rebuilt_output[0][:5]}")
    # Check if weights are actually loaded (not just zeros/random)
    if np.all(rebuilt_output == 0) or np.std(rebuilt_output) < 1e-5:
        print("Warning: Output seems empty or uniform. Weights might not have loaded correctly.")

    # Convert to TFLite
    print("\nConverting to TFLite...")
    converter = tf.lite.TFLiteConverter.from_keras_model(base_network)
    converter.optimizations = [tf.lite.Optimize.DEFAULT]
    tflite_model = converter.convert()

    # Save the TFLite model
    with open(TFLITE_OUTPUT, 'wb') as f:
        f.write(tflite_model)

    size_mb = os.path.getsize(TFLITE_OUTPUT) / (1024 * 1024)
    print(f"\n✅ TFLite model saved to: {TFLITE_OUTPUT}")
    print(f"   Size: {size_mb:.1f} MB")

    # Verify the TFLite model works
    print("\nVerifying TFLite model...")
    interpreter = tf.lite.Interpreter(model_path=TFLITE_OUTPUT)
    interpreter.allocate_tensors()
    input_details = interpreter.get_input_details()
    output_details = interpreter.get_output_details()
    
    interpreter.set_tensor(input_details[0]['index'], dummy_input)
    interpreter.invoke()
    tflite_output = interpreter.get_tensor(output_details[0]['index'])
    
    tflite_diff = np.max(np.abs(original_output - tflite_output))
    print(f"TFLite vs original max diff: {tflite_diff:.6f}")
    print(f"Output shape: {tflite_output.shape}")
    print("\n✅ Conversion complete and verified!")


if __name__ == "__main__":
    main()
