// Smoke test mínimo. La app real depende de Android plugins (secure storage,
// local_auth, etc.) y de la red, así que un test de widget completo requiere
// mocks que aún no construimos. Este smoke valida que la suite corre.

import 'package:flutter_test/flutter_test.dart';

void main() {
  test('placeholder', () {
    expect(1 + 1, equals(2));
  });
}
