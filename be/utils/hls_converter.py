"""
HLS Audio Converter

Converts M4A/AAC/WAV audio files to HLS format using FFmpeg.

Usage:
    convert_to_hls(
        input_file="uploads/raw/chapter-01.m4a",
        output_dir="processed/book-123/chapter-01"
    )
"""

import os
import subprocess
from pathlib import Path
from typing import Tuple


class HLSConversionError(Exception):
    """Custom exception for HLS conversion errors."""
    pass


def get_audio_metadata(input_path: Path) -> dict:
    """
    Extract duration and file size from audio file using FFprobe.

    Args:
        input_path: Path to the audio file

    Returns:
        Dictionary containing:
        - duration: Duration in seconds (integer)
        - file_size: File size in bytes (integer)

    Raises:
        HLSConversionError: If metadata extraction fails
    """
    try:
        # Get file size
        file_size = input_path.stat().st_size

        # Get duration using ffprobe
        command = [
            "ffprobe",
            "-v", "quiet",
            "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nokey=1",
            str(input_path)
        ]

        result = subprocess.run(
            command,
            capture_output=True,
            text=True,
            check=False
        )

        if result.returncode != 0:
            raise HLSConversionError(
                f"FFprobe failed with return code {result.returncode}. "
                f"Error: {result.stderr}"
            )

        # Parse duration (ffprobe returns float seconds)
        duration_str = result.stdout.strip()
        if not duration_str:
            raise HLSConversionError("FFprobe returned empty duration")

        duration = int(float(duration_str))  # Round to integer seconds

        return {
            "duration": duration,
            "file_size": file_size
        }

    except FileNotFoundError:
        raise HLSConversionError(
            "FFprobe not found. Please ensure FFmpeg/FFprobe is installed and in PATH."
        )
    except (ValueError, subprocess.SubprocessError) as e:
        raise HLSConversionError(f"Failed to extract audio metadata: {e}")


def validate_input_file(input_file: str) -> Path:
    """
    Validate the input file exists and has correct extension.

    Args:
        input_file: Path to the input audio file

    Returns:
        Path object of validated input file

    Raises:
        HLSConversionError: If validation fails
    """
    input_path = Path(input_file)

    if not input_path.exists():
        raise HLSConversionError(f"Input file does not exist: {input_file}")

    if not input_path.is_file():
        raise HLSConversionError(f"Input path is not a file: {input_file}")

    allowed_extensions = {".m4a", ".aac", ".wav"}
    if input_path.suffix.lower() not in allowed_extensions:
        raise HLSConversionError(
            f"Invalid file extension '{input_path.suffix}'. "
            f"Allowed: {', '.join(allowed_extensions)}"
        )

    return input_path


def create_output_directory(output_dir: str) -> Path:
    """
    Create output directory if it doesn't exist.

    Args:
        output_dir: Path to output directory

    Returns:
        Path object of output directory

    Raises:
        HLSConversionError: If directory creation fails
    """
    output_path = Path(output_dir)

    try:
        output_path.mkdir(parents=True, exist_ok=True)
    except OSError as e:
        raise HLSConversionError(f"Failed to create output directory: {e}")

    return output_path


def build_ffmpeg_command(input_path: Path, output_path: Path) -> list:
    """
    Build the FFmpeg command for HLS conversion.

    Args:
        input_path: Path to input audio file
        output_path: Path to output directory

    Returns:
        List of command arguments for subprocess
    """
    playlist_path = output_path / "playlist.m3u8"
    segment_pattern = output_path / "chunk_%03d.ts"

    return [
        "ffmpeg",
        "-i", str(input_path),
        "-y",  # Overwrite output files without asking
        "-vn",  # No video
        "-acodec", "aac",
        "-b:a", "64k",
        "-ac", "1",  # Mono
        "-ar", "44100",  # Sample rate
        "-f", "hls",
        "-hls_time", "15",  # Segment duration
        "-hls_playlist_type", "vod",
        "-hls_segment_filename", str(segment_pattern),
        "-hls_list_size", "0",  # Include all segments in playlist
        str(playlist_path)
    ]


def run_ffmpeg(command: list) -> Tuple[str, str]:
    """
    Execute FFmpeg command.

    Args:
        command: List of command arguments

    Returns:
        Tuple of (stdout, stderr)

    Raises:
        HLSConversionError: If FFmpeg execution fails
    """
    try:
        result = subprocess.run(
            command,
            capture_output=True,
            text=True,
            check=False
        )

        if result.returncode != 0:
            raise HLSConversionError(
                f"FFmpeg failed with return code {result.returncode}. "
                f"Error: {result.stderr}"
            )

        return result.stdout, result.stderr

    except FileNotFoundError:
        raise HLSConversionError(
            "FFmpeg not found. Please ensure FFmpeg is installed and in PATH."
        )
    except subprocess.SubprocessError as e:
        raise HLSConversionError(f"Failed to execute FFmpeg: {e}")


def convert_to_hls(input_file: str, output_dir: str) -> dict:
    """
    Convert an M4A/AAC/WAV audio file to HLS format.

    Creates an output directory containing:
    - playlist.m3u8: HLS playlist file
    - chunk_000.ts, chunk_001.ts, etc.: Audio segments

    HLS Settings:
    - Audio codec: AAC
    - Bitrate: 64 kbps
    - Channels: Mono
    - Sample rate: 44100 Hz
    - Segment duration: 15 seconds
    - Playlist type: VOD

    Args:
        input_file: Path to the input .m4a, .aac, or .wav file
        output_dir: Path to the output directory for HLS files

    Returns:
        Dictionary containing:
        - playlist: Path to the generated playlist file
        - output_dir: Path to the output directory
        - segments: List of generated segment files
        - duration: Audio duration in seconds
        - file_size: Original file size in bytes

    Raises:
        HLSConversionError: If conversion fails

    Example:
        result = convert_to_hls(
            input_file="uploads/raw/chapter-01.m4a",
            output_dir="processed/book-123/chapter-01"
        )
    """
    # Validate input
    input_path = validate_input_file(input_file)

    # Extract metadata BEFORE conversion
    metadata = get_audio_metadata(input_path)

    # Create output directory
    output_path = create_output_directory(output_dir)

    # Build and execute FFmpeg command
    command = build_ffmpeg_command(input_path, output_path)
    run_ffmpeg(command)

    # Collect generated files
    playlist_file = output_path / "playlist.m3u8"
    if not playlist_file.exists():
        raise HLSConversionError("Conversion completed but playlist file was not created")

    segments = sorted([
        str(f) for f in output_path.glob("chunk_*.ts")
    ])

    if not segments:
        raise HLSConversionError("Conversion completed but no segments were created")

    return {
        "playlist": str(playlist_file),
        "output_dir": str(output_path),
        "segments": segments,
        "duration": metadata["duration"],
        "file_size": metadata["file_size"],
    }
