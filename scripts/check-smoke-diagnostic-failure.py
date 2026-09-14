#!/usr/bin/env python3
"""Regression checks for optional diagnostics; native success is not simulated."""
import ast
import importlib.util
from pathlib import Path
import subprocess
import tempfile
import unittest
from unittest.mock import patch
path = Path(__file__).with_name('run-ios-playback-smoke.py')
spec = importlib.util.spec_from_file_location('smoke_driver', path)
driver = importlib.util.module_from_spec(spec)
spec.loader.exec_module(driver)

class SamplingTests(unittest.TestCase):
    def test_timeout_does_not_mask_playback_failure(self):
        with tempfile.TemporaryDirectory() as folder, patch.object(driver, 'OUT', Path(folder)), patch.object(driver, 'command', side_effect=subprocess.TimeoutExpired(['sample'], 15)):
            driver.sample_process('1234', Path(folder) / 'threads.txt')
            log = (Path(folder) / 'native-driver.log').read_text()
            self.assertIn('DIAGNOSTIC-ONLY', log)
            self.assertIn('TimeoutExpired', log)

    def test_missing_sampler_does_not_mask_playback_failure(self):
        with tempfile.TemporaryDirectory() as folder, patch.object(driver, 'OUT', Path(folder)), patch.object(driver, 'command', side_effect=FileNotFoundError('sample')):
            driver.sample_process('1234', Path(folder) / 'threads.txt')
            self.assertIn('FileNotFoundError', (Path(folder) / 'native-driver.log').read_text())

    def test_success_invokes_sample_with_a_deadline(self):
        with patch.object(driver, 'command', return_value='completed') as command:
            driver.sample_process('1234', Path('/tmp/threads.txt'))
            command.assert_called_once_with('/usr/bin/sample', '1234', '2', '-file', '/tmp/threads.txt', check=False, timeout=15)

    def test_invalid_pid_rejected(self):
        with self.assertRaises(ValueError):
            driver.sample_process('not-a-pid', Path('/tmp/threads.txt'))

    def test_sampler_failure_does_not_suppress_native_release_gate(self):
        tree = ast.parse(path.read_text())
        gates = [node for node in ast.walk(tree) if isinstance(node, ast.If) and isinstance(node.test, ast.Name) and node.test.id == 'native_failures']
        self.assertEqual(len(gates), 1)
        self.assertIsInstance(gates[0].body[0], ast.Raise)
        self.assertIn('device archive remains blocked', ast.unparse(gates[0]))
        self.assertIn('if len(inventory) != 54:', path.read_text())

if __name__ == '__main__':
    unittest.main(verbosity=2)
